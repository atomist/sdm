/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// tslint:disable:max-file-line-count

import {
    Configuration,
    configurationValue,
} from "@atomist/automation-client/lib/configuration";
import { automationClientInstance } from "@atomist/automation-client/lib/globals";
import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { doWithRetry } from "@atomist/automation-client/lib/util/retry";
import * as k8s from "@kubernetes/client-node";
import * as cluster from "cluster";
import * as fs from "fs-extra";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import * as os from "os";
import { goalData } from "../../../../api-helper/goal/sdmGoal";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import { GoalInvocation } from "../../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { GoalScheduler } from "../../../../api/goal/support/GoalScheduler";
import { ServiceRegistrationGoalDataKey } from "../../../../api/registration/ServiceRegistration";
import { toArray } from "../../../util/misc/array";
import { k8sErrMsg } from "../container";
import {
    loadKubeClusterConfig,
    loadKubeConfig,
} from "../kubernetes/config";
import { K8sNamespaceFile } from "../support/namespace";
import {
    K8sServiceRegistrationType,
    K8sServiceSpec,
} from "./service";

/**
 * Options to configure the k8s goal scheduling support
 */
export interface KubernetesGoalSchedulerOptions {
    isolateAll?: boolean;
    podSpec?: k8s.V1Pod;
}

/**
 * GoalScheduler implementation that schedules SDM goals inside k8s jobs.
 *
 * It reuses the podSpec of the deployed SDM to create a new jobSpec from.
 * Subclasses may change the spec and job creation behavior by overwriting beforeCreation
 * and/or afterCreation methods.
 */
export class KubernetesGoalScheduler implements GoalScheduler {

    public podSpec: k8s.V1Pod;

    constructor(private readonly options: KubernetesGoalSchedulerOptions = { isolateAll: false }) {
    }

    public async supports(gi: GoalInvocation): Promise<boolean> {
        return !process.env.ATOMIST_ISOLATED_GOAL &&
            (
                // Goal is marked as isolated and SDM is configured to use k8s jobs
                (gi.goal.definition.isolated && isConfiguredInEnv("kubernetes")) ||
                // Force all goals to run isolated via env var
                isConfiguredInEnv("kubernetes-all") ||
                // Force all goals to run isolated via explicit option
                (this.options.isolateAll && isConfiguredInEnv("kubernetes")) ||
                // Force all goals to run isolated via explicit configuration
                _.get(gi.configuration, "sdm.k8s.isolateAll", false) === true
            );
    }

    public async schedule(gi: GoalInvocation): Promise<ExecuteGoalResult> {
        const { goalEvent } = gi;

        const podNs = await readNamespace();

        const kc = loadKubeConfig();
        const batch = kc.makeApiClient(k8s.BatchV1Api);

        const defaultJobSpec = createJobSpec(_.cloneDeep(this.podSpec), podNs, gi);
        const jobSpec = await this.beforeCreation(gi, defaultJobSpec);
        const jobDesc = `k8s job '${jobSpec.metadata.namespace}:${jobSpec.metadata.name}' for goal '${goalEvent.uniqueName}'`;

        gi.progressLog.write(`/--`);
        gi.progressLog.write(
            `Scheduling k8s job '${jobSpec.metadata.namespace}:${jobSpec.metadata.name}' for goal '${goalEvent.name} (${goalEvent.uniqueName})'`);
        gi.progressLog.write("\\--");

        try {
            // Check if this job was previously launched
            await batch.readNamespacedJob(jobSpec.metadata.name, jobSpec.metadata.namespace);
            logger.debug(`${jobDesc} already exists. Deleting...`);
            try {
                await batch.deleteNamespacedJob(jobSpec.metadata.name, jobSpec.metadata.namespace, undefined, undefined,
                    undefined, undefined, undefined, { propagationPolicy: "Foreground" });
                logger.debug(`${jobDesc} deleted`);
            } catch (e) {
                logger.error(`Failed to delete ${jobDesc}: ${stringify(e.body)}`);
                return {
                    code: 1,
                    message: `Failed to delete ${jobDesc}: ${k8sErrMsg(e)}`,
                };
            }
        } catch (e) {
            // This is ok to ignore as it just means the job doesn't exist
        }

        try {
            logger.debug(`Job spec for ${jobDesc}: ${JSON.stringify(jobSpec)}`);
            // Previous deletion might not have completed; hence the retry here
            const jobResult = (await doWithRetry<{ body: k8s.V1Job }>(
                () => batch.createNamespacedJob(jobSpec.metadata.namespace, jobSpec),
                `Scheduling ${jobDesc}`)).body;

            await this.afterCreation(gi, jobResult);

            logger.info(`Scheduled ${jobDesc} with result: ${stringify(jobResult.status)}`);
            logger.log("silly", stringify(jobResult));
        } catch (e) {
            logger.error(`Failed to schedule ${jobDesc}: ${stringify(e.body)}`);
            return {
                code: 1,
                message: `Failed to schedule ${jobDesc}: ${k8sErrMsg(e)}`,
            };
        }
        await gi.progressLog.flush();
        return {
            code: 0,
            message: `Scheduled ${jobDesc}`,
        };
    }

    /**
     * Extension point for sub classes to modify the provided jobSpec
     * before the Job gets created in k8s.  It should return the
     * modified jobSpec.
     * @param gi goal invocation
     * @param jobSpec Default job spec
     * @return desired job spec
     */
    protected async beforeCreation(gi: GoalInvocation, jobSpec: k8s.V1Job): Promise<k8s.V1Job> {
        return jobSpec;
    }

    /**
     * Extension point for sub classes to modify k8s resources after the job has been created.
     * The provided jobSpec contains the result of the job creation API call.
     * @param gi
     * @param jobSpec
     */
    protected async afterCreation(gi: GoalInvocation, jobSpec: k8s.V1Job): Promise<void> {
        return;
    }

    public async initialize(configuration: Configuration): Promise<void> {
        const podName = process.env.ATOMIST_POD_NAME || os.hostname();
        const podNs = await readNamespace();

        try {
            const kc = loadKubeClusterConfig();
            const core = kc.makeApiClient(k8s.CoreV1Api);

            this.podSpec = (await core.readNamespacedPod(podName, podNs)).body;
        } catch (e) {
            logger.error(`Failed to obtain parent pod spec from k8s: ${k8sErrMsg(e)}`);

            if (!!this.options.podSpec) {
                this.podSpec = this.options.podSpec;
            } else {
                throw new Error(`Failed to obtain parent pod spec from k8s: ${k8sErrMsg(e)}`);
            }
        }

        if (configuration.cluster.enabled === false || cluster.isMaster) {
            const cleanupInterval = configuration.sdm.k8s?.job?.cleanupInterval || 1000 * 60 * 10;
            setInterval(async () => {
                try {
                    await this.cleanUp(configuration);
                    logger.debug("Finished cleaning scheduled goal Kubernetes jobs");
                } catch (e) {
                    logger.warn(`Failed cleaning scheduled goal Kubernetes jobs: ${e.message}`);
                }
            }, cleanupInterval).unref();
        }
    }

    /**
     * Extension point to allow for custom clean up logic.
     */
    protected async cleanUp(configuration: Configuration): Promise<void> {
        return cleanupJobs(configuration);
    }
}

/**
 * Cleanup scheduled k8s goal jobs
 * @returns {Promise<void>}
 */
async function cleanupJobs(configuration: Configuration): Promise<void> {
    const selector = `atomist.com/creator=${sanitizeName(configuration.name)}`;

    const jobs = await listJobs(selector);
    if (jobs.length < 1) {
        logger.debug(`No scheduled goal Kubernetes jobs found for label selector '${selector}'`);
        return;
    }
    const ttl: number = configuration.sdm.k8s?.job?.ttl || configuration.sdm.goal?.timeout * 2 || 1000 * 60 * 30;
    const now = Date.now();
    const oldJobs = jobs.filter(j => {
        if (!j.status?.startTime) {
            return false;
        }
        const jobAge = now - j.status.startTime.getTime();
        return jobAge > ttl;
    });
    if (oldJobs.length < 1) {
        logger.debug(`No scheduled goal Kubernetes jobs were older than TTL '${ttl}'`);
        return;
    }
    logger.debug("Deleting old scheduled goal Kubernetes jobs: " +
        oldJobs.map(j => `${j.metadata.namespace}/${j.metadata.name}`).join(","));
    for (const oldJob of oldJobs) {
        const job = { name: oldJob.metadata.name, namespace: oldJob.metadata.namespace };
        await deleteJob(job);
        await deletePods(job);
    }
}

/** Unique name for goal to use in k8s job spec. */
function k8sJobGoalName(goalEvent: SdmGoalEvent): string {
    return goalEvent.uniqueName.split("#")[0].toLowerCase();
}

/** Unique name for job to use in k8s job spec. */
export function k8sJobName(podSpec: k8s.V1Pod, goalEvent: SdmGoalEvent): string {
    const goalName = k8sJobGoalName(goalEvent);
    return `${podSpec.spec.containers[0].name}-job-${goalEvent.goalSetId.slice(0, 7)}-${goalName}`
        .slice(0, 63).replace(/[^a-z0-9]*$/, "");
}

/**
 * Kubernetes container spec environment variables that specify an SDM
 * running in single-goal mode.
 */
export function k8sJobEnv(podSpec: k8s.V1Pod, goalEvent: SdmGoalEvent, context: HandlerContext): k8s.V1EnvVar[] {
    const goalName = k8sJobGoalName(goalEvent);
    const jobName = k8sJobName(podSpec, goalEvent);
    const envVars: k8s.V1EnvVar[] = [
        {
            name: "ATOMIST_JOB_NAME",
            value: jobName,
        },
        {
            name: "ATOMIST_REGISTRATION_NAME",
            value: `${automationClientInstance().configuration.name}-job-${goalEvent.goalSetId.slice(0, 7)}-${goalName}`,
        },
        {
            name: "ATOMIST_GOAL_TEAM",
            value: context.workspaceId,
        },
        {
            name: "ATOMIST_GOAL_TEAM_NAME",
            value: (context as any as AutomationContextAware).context.workspaceName,
        },
        {
            name: "ATOMIST_GOAL_ID",
            value: (goalEvent as any).id,
        },
        {
            name: "ATOMIST_GOAL_SET_ID",
            value: goalEvent.goalSetId,
        },
        {
            name: "ATOMIST_GOAL_UNIQUE_NAME",
            value: goalEvent.uniqueName,
        },
        {
            name: "ATOMIST_CORRELATION_ID",
            value: context.correlationId,
        },
        {
            name: "ATOMIST_ISOLATED_GOAL",
            value: "true",
        },
    ];
    return envVars;
}

/**
 * Create a jobSpec by modifying the provided podSpec
 * @param podSpec
 * @param podNs
 * @param gi
 */
export function createJobSpec(podSpec: k8s.V1Pod, podNs: string, gi: GoalInvocation): k8s.V1Job {
    const { goalEvent, context } = gi;

    const jobSpec = createJobSpecWithAffinity(podSpec, gi);

    jobSpec.metadata.name = k8sJobName(podSpec, goalEvent);
    jobSpec.metadata.namespace = podNs;

    jobSpec.spec.backoffLimit = 0;
    jobSpec.spec.template.spec.restartPolicy = "Never";
    jobSpec.spec.template.spec.containers[0].name = jobSpec.metadata.name;

    jobSpec.spec.template.spec.containers[0].env.push(...k8sJobEnv(podSpec, goalEvent, context));
    delete jobSpec.spec.template.spec.containers[0].livenessProbe;
    delete jobSpec.spec.template.spec.containers[0].readinessProbe;

    rewriteCachePath(jobSpec, context.workspaceId);

    // Add additional specs from registered services to the job spec
    if (_.get(gi.configuration, "sdm.k8s.service.enabled", true)) {
        if (!!goalEvent.data) {
            let data: any;
            try {
                data = goalData(goalEvent);
            } catch (e) {
                logger.warn(`Failed to parse goal data on '${goalEvent.uniqueName}'`);
                data = {};
            }
            if (!!data[ServiceRegistrationGoalDataKey]) {
                _.forEach(data[ServiceRegistrationGoalDataKey], (v, k) => {
                    logger.debug(`Service with name '${k}' and type '${v.type}' found for goal '${goalEvent.uniqueName}'`);
                    if (v.type === K8sServiceRegistrationType.K8sService) {
                        const spec = v.spec as K8sServiceSpec;
                        if (!!spec.container) {
                            const c = toArray<k8s.V1Container>(spec.container as any);
                            jobSpec.spec.template.spec.containers.push(...c);
                        }

                        if (!!spec.initContainer) {
                            const ic = toArray<k8s.V1Container>(spec.initContainer as any);
                            jobSpec.spec.template.spec.initContainers = [
                                ...(jobSpec.spec.template.spec.initContainers || []),
                                ...ic,
                            ];
                        }

                        if (!!spec.volume) {
                            const vo = toArray<k8s.V1Volume>(spec.volume as any);
                            jobSpec.spec.template.spec.volumes = [
                                ...(jobSpec.spec.template.spec.volumes || []),
                                ...vo,
                            ];
                        }

                        if (!!spec.volumeMount) {
                            const vm = toArray<k8s.V1VolumeMount>(spec.volumeMount as any);
                            [...jobSpec.spec.template.spec.containers, ...jobSpec.spec.template.spec.initContainers].forEach(c => {
                                c.volumeMounts = [
                                    ...(c.volumeMounts || []),
                                    ...vm,
                                ];
                            });
                        }

                        if (!!spec.imagePullSecret) {
                            const ips = toArray<k8s.V1LocalObjectReference>(spec.imagePullSecret as any);
                            jobSpec.spec.template.spec.imagePullSecrets = [
                                ...(jobSpec.spec.template.spec.imagePullSecrets || []),
                                ...ips,
                            ];
                        }
                    }
                });
            }
        }
    }

    return jobSpec;
}

/**
 * Create a k8s Job spec with affinity to jobs for the same goal set
 * @param goalSetId
 */
function createJobSpecWithAffinity(podSpec: k8s.V1Pod, gi: GoalInvocation): k8s.V1Job {
    const { goalEvent, configuration, context } = gi;

    _.defaultsDeep(podSpec.spec.affinity, {
        podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
                {
                    weight: 100,
                    podAffinityTerm: {
                        labelSelector: {
                            matchExpressions: [
                                {
                                    key: "atomist.com/goal-set-id",
                                    operator: "In",
                                    values: [
                                        goalEvent.goalSetId,
                                    ],
                                },
                            ],
                        },
                        topologyKey: "kubernetes.io/hostname",
                    },
                },
            ],
        },
    });

    // Clean up podSpec
    // See https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.13/#pod-v1-core note on nodeName
    delete podSpec.spec.nodeName;

    const labels = {
        "atomist.com/goal-set-id": goalEvent.goalSetId,
        "atomist.com/goal-id": (goalEvent as any).id,
        "atomist.com/creator": sanitizeName(configuration.name),
        "atomist.com/workspace-id": context.workspaceId,
    };

    const detail = {
        sdm: {
            name: configuration.name,
            version: configuration.version,
        },
        goal: {
            goalId: (goalEvent as any).id,
            goalSetId: goalEvent.goalSetId,
            uniqueName: goalEvent.uniqueName,
        },
    };

    const annotations = {
        "atomist.com/sdm": JSON.stringify(detail),
    };

    return {
        kind: "Job",
        apiVersion: "batch/v1",
        metadata: {
            labels,
            annotations,
        },
        spec: {
            template: {
                metadata: {
                    labels,
                },
                spec: podSpec.spec,
            },
        },
    } as any;
}

/**
 * Rewrite the volume host path to include the workspace id to prevent cross workspace content ending
 * up in the same directory.
 * @param jobSpec
 * @param workspaceId
 */
function rewriteCachePath(jobSpec: k8s.V1Job, workspaceId: string): void {
    const cachePath = configurationValue("sdm.cache.path", "/opt/data");
    const containers: k8s.V1Container[] = _.get(jobSpec, "spec.template.spec.containers", []);

    const cacheVolumeNames: string[] = [];
    containers.forEach(c => {
        cacheVolumeNames.push(...c.volumeMounts.filter(vm => vm.mountPath === cachePath).map(cm => cm.name));
    });

    _.uniq(cacheVolumeNames).forEach(vn => {
        const volume: k8s.V1Volume = _.get(jobSpec, "spec.template.spec.volumes", []).find(v => v.name === vn);
        if (!!volume && !!volume.hostPath && !!volume.hostPath.path) {
            const path = volume.hostPath.path;
            if (!path.endsWith(workspaceId) || !path.endsWith(`${workspaceId}/`)) {
                if (path.endsWith("/")) {
                    volume.hostPath.path = `${path}${workspaceId}`;
                } else {
                    volume.hostPath.path = `${path}/${workspaceId}`;
                }
            }
        }
    });
}

/**
 * Checks if one of the provided values is configured in ATOMIST_GOAL_SCHEDULER or -
 * for backwards compatibility reasons - ATOMIST_GOAL_LAUNCHER.
 * @param values
 */
export function isConfiguredInEnv(...values: string[]): boolean {
    const value = process.env.ATOMIST_GOAL_SCHEDULER || process.env.ATOMIST_GOAL_LAUNCHER;
    if (!!value) {
        try {
            const json = JSON.parse(value);
            if (Array.isArray(json)) {
                return json.some(v => values.includes(v));
            } else {
                return values.includes(json);
            }
        } catch (e) {
            if (typeof value === "string") {
                return values.includes(value);
            }
        }
    }
    return false;
}

/**
 * Strip out any characters that aren't allowed a k8s label value
 * @param name
 */
export function sanitizeName(name: string): string {
    return name.replace(/@/g, "").replace(/\//g, ".");
}

/**
 * List k8s jobs for a single namespace or cluster-wide depending on evn configuration
 * @param labelSelector
 */
export async function listJobs(labelSelector?: string): Promise<k8s.V1Job[]> {
    const kc = loadKubeConfig();
    const batch = kc.makeApiClient(k8s.BatchV1Api);

    const jobs: k8s.V1Job[] = [];
    let continu: string | undefined;
    try {
        if (configurationValue<boolean>("sdm.k8s.job.singleNamespace", true)) {
            const podNs = await readNamespace();
            do {
                const listJobResponse = await batch.listNamespacedJob(podNs, undefined, undefined, continu, undefined, labelSelector);
                jobs.push(...listJobResponse.body.items);
                continu = listJobResponse.body.metadata?._continue;
            } while (continu);
        } else {
            do {
                const listJobResponse = await batch.listJobForAllNamespaces(undefined, continu, undefined, labelSelector);
                jobs.push(...listJobResponse.body.items);
                continu = listJobResponse.body.metadata?._continue;
            } while (continu);
        }
    } catch (e) {
        e.message = `Failed to list scheduled goal Kubernetes jobs: ${k8sErrMsg(e)}`;
        throw e;
    }
    return jobs;
}

/**
 * Read the namespace of the deployment from environment and k8s service account files.
 * Falls back to the default namespace and no other configuration can be found.
 */
export async function readNamespace(): Promise<string> {
    let podNs = process.env.ATOMIST_POD_NAMESPACE || process.env.ATOMIST_DEPLOYMENT_NAMESPACE;
    if (!!podNs) {
        return podNs;
    }

    if (await fs.pathExists(K8sNamespaceFile)) {
        podNs = (await fs.readFile(K8sNamespaceFile)).toString().trim();
    }

    if (!!podNs) {
        return podNs;
    }

    return "default";
}

export async function deleteJob(job: { name: string, namespace: string }): Promise<void> {
    try {
        const kc = loadKubeConfig();
        const batch = kc.makeApiClient(k8s.BatchV1Api);

        await batch.readNamespacedJob(job.name, job.namespace);
        try {
            await batch.deleteNamespacedJob(job.name, job.namespace, undefined, undefined, undefined, undefined,
                undefined, { propagationPolicy: "Foreground" });
        } catch (e) {
            logger.warn(`Failed to delete k8s jobs '${job.namespace}:${job.name}': ${k8sErrMsg(e)}`);
        }
    } catch (e) {
        // This is ok to ignore because the job doesn't exist any more
    }
}

export async function deletePods(job: { name: string, namespace: string }): Promise<void> {
    try {
        const kc = loadKubeConfig();
        const core = kc.makeApiClient(k8s.CoreV1Api);

        const selector = `job-name=${job.name}`;
        const pods = await core.listNamespacedPod(job.namespace, undefined, undefined, undefined, undefined, selector);
        if (pods.body && pods.body.items) {
            for (const pod of pods.body.items) {
                try {
                    await core.deleteNamespacedPod(pod.metadata.name, pod.metadata.namespace, undefined, undefined,
                        undefined, undefined, undefined, { propagationPolicy: "Foreground" });
                } catch (e) {
                    // Probably ok because pod might be gone already
                    logger.debug(`Failed to delete k8s pod '${pod.metadata.namespace}:${pod.metadata.name}': ${k8sErrMsg(e)}`);
                }
            }
        }
    } catch (e) {
        logger.warn(`Failed to list pods for k8s job '${job.namespace}:${job.name}': ${k8sErrMsg(e)}`);
    }
}
