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

import { sleep } from "@atomist/automation-client/lib/internal/util/poll";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as k8s from "@kubernetes/client-node";
import * as fs from "fs-extra";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import * as request from "request";
import { Writable } from "stream";
import {
    DeepPartial,
    Merge,
} from "ts-essentials";
import { minimalClone } from "../../../api-helper/goal/minimalClone";
import { RepoContext } from "../../../api/context/SdmContext";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
} from "../../../api/goal/GoalInvocation";
import {
    GoalWithFulfillment,
    ImplementationRegistration,
} from "../../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { GoalScheduler } from "../../../api/goal/support/GoalScheduler";
import { ServiceRegistrationGoalDataKey } from "../../../api/registration/ServiceRegistration";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { SdmGoalState } from "../../../typings/types";
import { loadKubeConfig } from "../../pack/k8s/kubernetes/config";
import {
    k8sJobEnv,
    KubernetesGoalScheduler,
    readNamespace,
} from "../../pack/k8s/scheduler/KubernetesGoalScheduler";
import {
    K8sServiceRegistrationType,
    K8sServiceSpec,
} from "../../pack/k8s/scheduler/service";
import { toArray } from "../../util/misc/array";
import {
    CacheEntry,
    CacheOutputGoalDataKey,
    cachePut,
    cacheRestore,
} from "../cache/goalCaching";
import {
    Container,
    ContainerInput,
    ContainerOutput,
    ContainerProjectHome,
    ContainerRegistration,
    ContainerRegistrationGoalDataKey,
    ContainerScheduler,
    GoalContainer,
    GoalContainerVolume,
} from "./container";
import { prepareSecrets } from "./provider";
import {
    containerEnvVars,
    prepareInputAndOutput,
    processResult,
} from "./util";

// tslint:disable:max-file-line-count

/** Merge of base and Kubernetes goal container interfaces. */
export type K8sGoalContainer =
    Merge<GoalContainer, DeepPartial<k8s.V1Container>>
    & Pick<GoalContainer, "name" | "image">;
/** Merge of base and Kubernetes goal container volume interfaces. */
export type K8sGoalContainerVolume = Merge<k8s.V1Volume, GoalContainerVolume>;

/** @deprecated use K8sContainerSpecCallback */
export type K8sGoalContainerSpec = Omit<K8sContainerRegistration, "callback">;

/**
 * Function signature for callback that can modify and return the
 * [[ContainerRegistration]] object.
 */
export type K8sContainerSpecCallback =
    (r: K8sContainerRegistration, p: GitProject, g: Container, e: SdmGoalEvent, ctx: RepoContext) =>
        Promise<Omit<K8sContainerRegistration, "callback">>;

/**
 * Additional options for Kubernetes implementation of container goals.
 */
export interface K8sContainerRegistration extends ContainerRegistration {
    /**
     * Replace generic containers in [[ContainerRegistration]] with
     * Kubernetes containers.
     *
     * Containers to run for this goal.  The goal result is based on
     * the exit status of the first element of the `containers` array.
     * The other containers are considered "sidecar" containers
     * provided functionality that the main container needs to
     * function.  If not set, the working directory of the first
     * container is set to [[ContainerProjectHome]], which contains
     * the project upon which the goal should operate.  If
     * `workingDir` is set, it is not changed.  If `workingDir` is set
     * to the empty string, the `workingDir` property is deleted from
     * the main container spec, meaning the container default working
     * directory will be used.
     */
    containers: K8sGoalContainer[];
    /**
     * Replace generic callback in [[ContainerRegistration]] with
     * Kubernetes-specific callback.
     */
    callback?: K8sContainerSpecCallback;
    /**
     * Init containers to run for this goal.  Any containers provided
     * here will run after the one inserted by the SDM to manage the
     * cloned repository.
     */
    initContainers?: k8s.V1Container[];
    /**
     * Replace generic volumes in [[ContainerRegistration]] with
     * Kubernetes volumes available to mount in containers.
     */
    volumes?: K8sGoalContainerVolume[];
}

export const k8sContainerScheduler: ContainerScheduler = (goal, registration: K8sContainerRegistration) => {
    goal.addFulfillment({
        goalExecutor: executeK8sJob(),
        ...registration as ImplementationRegistration,
    });

    goal.addFulfillmentCallback({
        goal,
        callback: k8sFulfillmentCallback(goal, registration),
    });
};

export const k8sSkillContainerScheduler: ContainerScheduler = (goal, registration: K8sContainerRegistration) => {
    goal.addFulfillment({
        goalExecutor: executeK8sJob(),
        ...registration as ImplementationRegistration,
    });
};

/**
 * Add Kubernetes job scheduling information to SDM goal event data
 * for use by the [[KubernetesGoalScheduler]].
 */
export function k8sFulfillmentCallback(
    goal: Container,
    registration: K8sContainerRegistration,
): (sge: SdmGoalEvent, rc: RepoContext) => Promise<SdmGoalEvent> {
    // tslint:disable-next-line:cyclomatic-complexity
    return async (goalEvent, repoContext) => {
        let spec: K8sContainerRegistration = _.cloneDeep(registration);
        if (registration.callback) {
            spec = await repoContext.configuration.sdm.projectLoader.doWithProject({
                ...repoContext,
                readOnly: true,
                cloneOptions: minimalClone(goalEvent.push, { detachHead: true }),
            }, async p => {
                return {
                    ...spec,
                    ...(await registration.callback(_.cloneDeep(registration), p, goal, goalEvent, repoContext)) || {},
                };
            });
        }

        if (!spec.containers || spec.containers.length < 1) {
            throw new Error("No containers defined in K8sGoalContainerSpec");
        }

        // Preserve the container registration in the goal data before it gets munged with internals
        let data = parseGoalEventData(goalEvent);
        let newData: any = {};
        delete spec.callback;
        _.set<any>(newData, ContainerRegistrationGoalDataKey, spec);
        goalEvent.data = JSON.stringify(_.merge(data, newData));

        if (spec.containers[0].workingDir === "") {
            delete spec.containers[0].workingDir;
        } else if (!spec.containers[0].workingDir) {
            spec.containers[0].workingDir = ContainerProjectHome;
        }

        const goalSchedulers: GoalScheduler[] = toArray(repoContext.configuration.sdm.goalScheduler) || [];
        const k8sScheduler = goalSchedulers.find(gs => gs instanceof KubernetesGoalScheduler) as KubernetesGoalScheduler;
        if (!k8sScheduler) {
            throw new Error("Failed to find KubernetesGoalScheduler in goal schedulers");
        }
        if (!k8sScheduler.podSpec) {
            throw new Error("KubernetesGoalScheduler has no podSpec defined");
        }

        const containerEnvs = await containerEnvVars(goalEvent, repoContext);
        const projectVolume = `project-${guid().split("-")[0]}`;
        const inputVolume = `input-${guid().split("-")[0]}`;
        const outputVolume = `output-${guid().split("-")[0]}`;
        const ioVolumes = [
            {
                name: projectVolume,
                emptyDir: {},
            },
            {
                name: inputVolume,
                emptyDir: {},
            },
            {
                name: outputVolume,
                emptyDir: {},
            },
        ];
        const ioVolumeMounts = [
            {
                mountPath: ContainerProjectHome,
                name: projectVolume,
            },
            {
                mountPath: ContainerInput,
                name: inputVolume,
            },
            {
                mountPath: ContainerOutput,
                name: outputVolume,
            },
        ];

        const copyContainer = _.cloneDeep(k8sScheduler.podSpec.spec.containers[0]);
        delete copyContainer.lifecycle;
        delete copyContainer.livenessProbe;
        delete copyContainer.readinessProbe;
        copyContainer.name = `container-goal-init-${guid().split("-")[0]}`;
        copyContainer.env = [
            ...(copyContainer.env || []),
            ...k8sJobEnv(k8sScheduler.podSpec, goalEvent, repoContext.context as any),
            ...containerEnvs,
            {
                name: "ATOMIST_ISOLATED_GOAL_INIT",
                value: "true",
            },
            {
                name: "ATOMIST_CONFIG",
                value: JSON.stringify({
                    cluster: {
                        enabled: false,
                    },
                    ws: {
                        enabled: false,
                    },
                }),
            },
        ];
        spec.initContainers = spec.initContainers || [];

        const parameters = JSON.parse((goalEvent as any).parameters || "{}");
        const secrets = await prepareSecrets(
            _.merge({}, registration.containers[0], (parameters["@atomist/sdm/secrets"] || {})), repoContext);
        delete spec.containers[0].secrets;
        [...spec.containers, ...spec.initContainers].forEach(c => {
            c.env = [
                ...(secrets.env || []),
                ...containerEnvs,
                ...(c.env || []),
            ];
        });
        if (!!secrets?.files) {
            for (const file of secrets.files) {
                const fileName = path.basename(file.mountPath);
                const dirname = path.dirname(file.mountPath);
                let secretName = `secret-${guid().split("-")[0]}`;

                const vm = (copyContainer.volumeMounts || [])
                    .find(m => m.mountPath === dirname);
                if (!!vm) {
                    secretName = vm.name;
                } else {
                    copyContainer.volumeMounts = [
                        ...(copyContainer.volumeMounts || []),
                        {
                            mountPath: dirname,
                            name: secretName,
                        },
                    ];
                    spec.volumes = [
                        ...(spec.volumes || []),
                        {
                            name: secretName,
                            emptyDir: {},
                        } as any,
                    ];
                }
                [...spec.containers, ...spec.initContainers].forEach((c: k8s.V1Container) => {
                    c.volumeMounts = [
                        ...(c.volumeMounts || []),
                        {
                            mountPath: file.mountPath,
                            name: secretName,
                            subPath: fileName,
                        },
                    ];
                });
            }
        }
        spec.initContainers = [
            copyContainer,
            ...spec.initContainers,
        ];

        const serviceSpec: { type: string, spec: K8sServiceSpec } = {
            type: K8sServiceRegistrationType.K8sService,
            spec: {
                container: spec.containers,
                initContainer: spec.initContainers,
                volume: [
                    ...ioVolumes,
                    ...(spec.volumes || []),
                ],
                volumeMount: ioVolumeMounts,
            },
        };

        // Store k8s service registration in goal data
        data = JSON.parse(goalEvent.data || "{}");
        newData = {};
        _.set<any>(newData, `${ServiceRegistrationGoalDataKey}.${registration.name}`, serviceSpec);
        goalEvent.data = JSON.stringify(_.merge(data, newData));
        return goalEvent;
    };
}

/**
 * Get container registration from goal event data, use
 * [[k8sFulfillmentcallback]] to get a goal event schedulable by a
 * [[KubernetesGoalScheduler]], then schedule the goal using that
 * scheduler.
 */
export const scheduleK8sJob: ExecuteGoal = async gi => {
    const { goalEvent } = gi;
    const { uniqueName } = goalEvent;
    const data = parseGoalEventData(goalEvent);
    const containerReg: K8sContainerRegistration = data["@atomist/sdm/container"];
    if (!containerReg) {
        throw new Error(`Goal ${uniqueName} event data has no container spec: ${goalEvent.data}`);
    }

    const goalSchedulers: GoalScheduler[] = toArray(gi.configuration.sdm.goalScheduler) || [];
    const k8sScheduler = goalSchedulers.find(gs => gs instanceof KubernetesGoalScheduler) as KubernetesGoalScheduler;
    if (!k8sScheduler) {
        throw new Error(`Failed to find KubernetesGoalScheduler in goal schedulers: ${stringify(goalSchedulers)}`);
    }

    // the k8sFulfillmentCallback may already have been called, so wipe it out
    delete data[ServiceRegistrationGoalDataKey];
    goalEvent.data = JSON.stringify(data);

    try {
        const schedulableGoalEvent = await k8sFulfillmentCallback(gi.goal as Container, containerReg)(goalEvent, gi);
        const scheduleResult = await k8sScheduler.schedule({ ...gi, goalEvent: schedulableGoalEvent });
        if (scheduleResult.code) {
            return {
                ...scheduleResult,
                message: `Failed to schedule container goal ${uniqueName}: ${scheduleResult.message}`,
            };
        }
        schedulableGoalEvent.state = SdmGoalState.in_process;
        return schedulableGoalEvent;
    } catch (e) {
        const message = `Failed to schedule container goal ${uniqueName} as Kubernetes job: ${e.message}`;
        gi.progressLog.write(message);
        return { code: 1, message };
    }
};

/** Container information useful the various functions. */
interface K8sContainer {
    /** Kubernetes configuration to use when creating API clients */
    config: k8s.KubeConfig;
    /** Name of container in pod */
    name: string;
    /** Pod name */
    pod: string;
    /** Pod namespace */
    ns: string;
    /** Log */
    log: ProgressLog;
}

/**
 * Wait for first container to exit and stream its logs to the
 * progress log.
 */
export function executeK8sJob(): ExecuteGoal {
    // tslint:disable-next-line:cyclomatic-complexity
    return async gi => {
        const { goalEvent, progressLog, configuration, id, credentials } = gi;

        const projectDir = process.env.ATOMIST_PROJECT_DIR || ContainerProjectHome;
        const inputDir = process.env.ATOMIST_INPUT_DIR || ContainerInput;
        const outputDir = process.env.ATOMIST_OUTPUT_DIR || ContainerOutput;

        const data = parseGoalEventData(goalEvent);
        if (!data[ContainerRegistrationGoalDataKey]) {
            throw new Error("Failed to read k8s ContainerRegistration from goal data");
        }
        if (!data[ContainerRegistrationGoalDataKey]) {
            throw new Error(`Goal ${gi.goal.uniqueName} has no Kubernetes container registration: ${gi.goalEvent.data}`);
        }
        const registration: K8sContainerRegistration = data[ContainerRegistrationGoalDataKey];

        if (process.env.ATOMIST_ISOLATED_GOAL_INIT === "true") {
            return configuration.sdm.projectLoader.doWithProject({
                ...gi,
                readOnly: false,
                cloneDir: projectDir,
                cloneOptions: minimalClone(goalEvent.push, { detachHead: true }),
            }, async project => {
                try {
                    await prepareInputAndOutput(inputDir, outputDir, gi);
                } catch (e) {
                    const message = `Failed to prepare input and output for goal ${goalEvent.name}: ${e.message}`;
                    progressLog.write(message);
                    return { code: 1, message };
                }
                const secrets = await prepareSecrets(
                    _.merge({}, registration.containers[0], ((gi.parameters || {})["@atomist/sdm/secrets"] || {})), gi);
                if (!!secrets?.files) {
                    for (const file of secrets.files) {
                        await fs.writeFile(file.mountPath, file.value);
                    }
                }

                goalEvent.state = SdmGoalState.in_process;
                return goalEvent;

            });
        }

        let containerName: string = _.get(registration, "containers[0].name");
        if (!containerName) {
            const msg = `Failed to get main container name from goal registration: ${stringify(registration)}`;
            progressLog.write(msg);
            let svcSpec: K8sServiceSpec;
            try {
                svcSpec = _.get(data, `${ServiceRegistrationGoalDataKey}.${registration.name}.spec`);
            } catch (e) {
                const message = `Failed to parse Kubernetes spec from goal data '${goalEvent.data}': ${e.message}`;
                progressLog.write(message);
                return { code: 1, message };
            }
            containerName = _.get(svcSpec, "container[1].name");
            if (!containerName) {
                const message = `Failed to get main container name from either goal registration or data: '${goalEvent.data}'`;
                progressLog.write(message);
                return { code: 1, message };
            }
        }
        const ns = await readNamespace();
        const podName = os.hostname();

        let kc: k8s.KubeConfig;
        try {
            kc = loadKubeConfig();
        } catch (e) {
            const message = `Failed to load Kubernetes configuration: ${e.message}`;
            progressLog.write(message);
            return { code: 1, message };
        }

        const container: K8sContainer = {
            config: kc,
            name: containerName,
            pod: podName,
            ns,
            log: progressLog,
        };

        try {
            await containerStarted(container);
        } catch (e) {
            const message = `Failed to determine if container started: ${e.message}`;
            progressLog.write(message);
            return { code: 1, message };
        }

        const status = { code: 0, message: `Container '${containerName}' completed successfully` };
        try {
            const timeout: number = configuration.sdm?.goal?.timeout || 10 * 60 * 1000;
            const podStatus = await containerWatch(container, timeout);
            progressLog.write(`Container '${containerName}' exited: ${stringify(podStatus)}`);
        } catch (e) {
            const message = `Container '${containerName}' failed: ${e.message}`;
            progressLog.write(message);
            status.code++;
            status.message = message;
        }

        const outputFile = path.join(outputDir, "result.json");
        let outputResult: ExecuteGoalResult;
        if (status.code === 0 && (await fs.pathExists(outputFile))) {
            try {
                outputResult = await processResult(await fs.readJson(outputFile), gi);
            } catch (e) {
                const message = `Failed to read output from container: ${e.message}`;
                progressLog.write(message);
                status.code++;
                status.message += ` but f${message.slice(1)}`;
            }
        }

        const cacheEntriesToPut: CacheEntry[] = [
            ...(registration.output || []),
            ...((gi.parameters || {})[CacheOutputGoalDataKey] || []),
        ];
        if (cacheEntriesToPut.length > 0) {
            try {
                const project = GitCommandGitProject.fromBaseDir(id, projectDir, credentials, async () => {
                });
                const cp = cachePut({
                    entries: cacheEntriesToPut.map(e => {
                        // Prevent the type on the entry to get passed along when goal actually failed
                        if (status.code !== 0) {
                            return {
                                classifier: e.classifier,
                                pattern: e.pattern,
                            };
                        } else {
                            return e;
                        }
                    }),
                });
                await cp.listener(project, gi, GoalProjectListenerEvent.after);
            } catch (e) {
                const message = `Failed to put cache output from container: ${e.message}`;
                progressLog.write(message);
                status.code++;
                status.message += ` but f${message.slice(1)}`;
            }
        }

        return outputResult || status;
    };
}

/**
 * Read and parse container goal registration from goal event data.
 */
export function parseGoalEventData(goalEvent: SdmGoalEvent): any {
    const goalName = goalEvent.uniqueName;
    if (!goalEvent || !goalEvent.data) {
        return {};
    }
    let data: any;
    try {
        data = JSON.parse(goalEvent.data);
    } catch (e) {
        e.message = `Failed to parse goal event data for ${goalName} as JSON '${goalEvent.data}': ${e.message}`;
        throw e;
    }
    return data;
}

/**
 * If running as isolated goal, use [[executeK8sJob]] to execute the
 * goal.  Otherwise, schedule the goal execution as a Kubernetes job
 * using [[scheduleK8sJob]].
 */
const containerExecutor: ExecuteGoal = gi => (process.env.ATOMIST_ISOLATED_GOAL) ? executeK8sJob()(gi) : scheduleK8sJob(gi);

/**
 * Restore cache input entries before fulfilling goal.
 */
const containerFulfillerCacheRestore: GoalProjectListenerRegistration = {
    name: "cache restore",
    events: [GoalProjectListenerEvent.before],
    listener: async (project, gi) => {
        const data = parseGoalEventData(gi.goalEvent);
        if (!data[ContainerRegistrationGoalDataKey]) {
            throw new Error(`Goal ${gi.goal.uniqueName} has no Kubernetes container registration: ${gi.goalEvent.data}`);
        }
        const registration: K8sContainerRegistration = data[ContainerRegistrationGoalDataKey];
        if (registration.input && registration.input.length > 0) {
            try {
                const cp = cacheRestore({ entries: registration.input });
                return cp.listener(project, gi, GoalProjectListenerEvent.before);
            } catch (e) {
                const message = `Failed to restore cache input to container for goal ${gi.goal.uniqueName}: ${e.message}`;
                gi.progressLog.write(message);
                return { code: 1, message };
            }
        } else {
            return { code: 0, message: "No container input cache entries to restore" };
        }
    },
};

/** Deterministic name for Kubernetes container goal fulfiller. */
export const K8sContainerFulfillerName = "Kubernetes Container Goal Fulfiller";

/**
 * Goal that fulfills requested container goals by scheduling them as
 * Kubernetes jobs.
 */
export function k8sContainerFulfiller(): GoalWithFulfillment {
    return new GoalWithFulfillment({
        displayName: K8sContainerFulfillerName,
        uniqueName: K8sContainerFulfillerName,
    })
        .with({
            goalExecutor: containerExecutor,
            name: `${K8sContainerFulfillerName} Executor`,
        })
        .withProjectListener(containerFulfillerCacheRestore);
}

/**
 * Wait for container in pod to start, return when it does.
 *
 * @param container Information about container to check
 * @param attempts Maximum number of attempts, waiting 500 ms between
 */
async function containerStarted(container: K8sContainer, attempts: number = 240): Promise<void> {
    let core: k8s.CoreV1Api;
    try {
        core = container.config.makeApiClient(k8s.CoreV1Api);
    } catch (e) {
        e.message = `Failed to create Kubernetes core API client: ${e.message}`;
        container.log.write(e.message);
        throw e;
    }

    const sleepTime = 500; // ms
    for (let i = 0; i < attempts; i++) {
        await sleep(500);
        let pod: k8s.V1Pod;
        try {
            pod = (await core.readNamespacedPod(container.pod, container.ns)).body;
        } catch (e) {
            container.log.write(`Reading pod ${container.ns}/${container.pod} failed: ${k8sErrMsg(e)}`);
            continue;
        }
        const containerStatus = pod.status.containerStatuses.find(c => c.name === container.name);
        if (containerStatus && (!!containerStatus.state?.running?.startedAt || !!containerStatus.state?.terminated)) {
            const message = `Container '${container.name}' started`;
            container.log.write(message);
            return;
        }
    }

    const errMsg = `Container '${container.name}' failed to start within ${attempts * sleepTime} ms`;
    container.log.write(errMsg);
    throw new Error(errMsg);
}

/** Items used to in watching main container and its logs. */
interface ContainerDetritus {
    logStream?: Writable;
    logRequest?: request.Request;
    watcher?: any;
    timeout?: NodeJS.Timeout;
}

/**
 * Watch pod until container `container.name` exits and its log stream
 * is done being written to.  Resolve promise with status if container
 * `container.name` exits with status 0.  If container exits with
 * non-zero status, reject promise and includ pod status in the
 * `podStatus` property of the error.  If any other error occurs,
 * e.g., a watch or log error or timeout exceeded, reject immediately
 * upon receipt of error.
 *
 * @param container Information about container to watch
 * @param timeout Milliseconds to allow container to run
 * @return Status of pod after container terminates
 */
function containerWatch(container: K8sContainer, timeout: number): Promise<k8s.V1PodStatus> {
    return new Promise(async (resolve, reject) => {
        const clean: ContainerDetritus = {};
        const k8sLog = new k8s.Log(container.config);
        clean.logStream = new Writable({
            write: (chunk, encoding, callback) => {
                container.log.write(chunk.toString());
                callback();
            },
        });
        let logDone = false;
        let podStatus: k8s.V1PodStatus | undefined;
        let podError: Error | undefined;
        const doneCallback = (e: any) => {
            logDone = true;
            if (e) {
                e.message = `Container logging error: ${k8sErrMsg(e)}`;
                container.log.write(e.message);
                containerCleanup(clean);
                reject(e);
            }
            if (podStatus) {
                containerCleanup(clean);
                resolve(podStatus);
            } else if (podError) {
                containerCleanup(clean);
                reject(podError);
            }
        };
        const logOptions: k8s.LogOptions = { follow: true };
        clean.logRequest = k8sLog.log(container.ns, container.pod, container.name, clean.logStream, doneCallback, logOptions);

        let watch: k8s.Watch;
        try {
            watch = new k8s.Watch(container.config);
        } catch (e) {
            e.message = `Failed to create Kubernetes watch client: ${e.message}`;
            container.log.write(e.message);
            containerCleanup(clean);
            reject(e);
        }
        clean.timeout = setTimeout(() => {
            containerCleanup(clean);
            reject(new Error(`Goal timeout '${timeout}' exceeded`));
        }, timeout);
        const watchPath = `/api/v1/watch/namespaces/${container.ns}/pods/${container.pod}`;
        clean.watcher = await watch.watch(watchPath, {}, async (phase, obj) => {
            const pod = obj as k8s.V1Pod;
            if (pod?.status?.containerStatuses) {
                const containerStatus = pod.status.containerStatuses.find(c => c.name === container.name);
                if (containerStatus?.state?.terminated) {
                    const exitCode: number = containerStatus.state.terminated.exitCode;
                    if (exitCode === 0) {
                        podStatus = pod.status;
                        const msg = `Container '${container.name}' exited with status 0`;
                        container.log.write(msg);
                        if (logDone) {
                            containerCleanup(clean);
                            resolve(podStatus);
                        }
                    } else {
                        const msg = `Container '${container.name}' exited with status ${exitCode}`;
                        container.log.write(msg);
                        podError = new Error(msg);
                        (podError as any).podStatus = pod.status;
                        if (logDone) {
                            containerCleanup(clean);
                            reject(podError);
                        }
                    }
                    return;
                }
            }
            container.log.write(`Container '${container.name}' phase: ${phase}`);
        }, err => {
            err.message = `Container watcher failed: ${err.message}`;
            container.log.write(err.message);
            containerCleanup(clean);
            reject(err);
        });
    });
}

/** Clean up resources used to watch running container. */
function containerCleanup(c: ContainerDetritus): void {
    if (c.timeout) {
        clearTimeout(c.timeout);
    }
    if (c.logRequest?.abort) {
        c.logRequest.abort();
    }
    if (c.logStream?.end) {
        c.logStream.end();
    }
    if (c.watcher?.abort) {
        c.watcher.abort();
    }
}

/** Try to find a Kubernetes API error message. */
export function k8sErrMsg(e: any): string {
    if (e.message && typeof e.message === "string") {
        return e.message;
    } else if (e.body && typeof e.body === "string") {
        return e.body;
    } else if (e.body?.message && typeof e.body.message === "string") {
        return e.body.message;
    } else if (e.response?.body && typeof e.response.body === "string") {
        return e.response.body;
    } else if (e.response?.body?.message && typeof e.response.body.message === "string") {
        return e.response.body.message;
    } else {
        return "Kubernetes API request error";
    }
}
