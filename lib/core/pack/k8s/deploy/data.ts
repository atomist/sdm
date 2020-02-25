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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import * as dockerfileParser from "docker-file-parser";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { DeepPartial } from "ts-essentials";
import { GoalInvocation } from "../../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { readSdmVersion } from "../../../delivery/build/local/projectVersioner";
import { validName } from "../kubernetes/name";
import { KubernetesApplication } from "../kubernetes/request";
import { K8sDefaultNamespace } from "../support/namespace";
import { KubernetesDeployFulfillerGoalName } from "./fulfiller";
import {
    goalEventSlug,
    KubernetesDeploy,
    KubernetesDeployDataSources,
    KubernetesDeployRegistration,
} from "./goal";
import { loadKubernetesSpec } from "./spec";

/**
 * JSON propery under the goal event data where the
 * [[KubernetesDeployment]] goal [[KubernetesApplication]] data are
 * stored, i.e., the value of `goal.data[sdmPackK8s]`.
 */
export const sdmPackK8s = "@atomist/sdm-pack-k8s";

/**
 * Generate KubernetesApplication from goal, goal registration,
 * project, and goal invocation.  The priority of the various sources
 * of KubernetesApplication data are, from lowest to highest:
 *
 * 1.  Starting point is `{ ns: defaultNamespace }`
 * 2.  [[KubernetesDeployDataSources.SdmConfiguration]]
 * 3.  [[defaultKubernetesApplication]]
 * 4.  [[KubernetesDeployDataSources.Dockerfile]]
 * 5.  The various partial Kubernetes specs under `.atomist/kubernetes`
 * 6.  [[KubernetesDeployDataSources.GoalEvent]]
 * 7.  [[KubernetesDeployRegistration.applicationData]]
 *
 * Specific sources can be enabled/disabled via the
 * [[KubernetesDeployRegistration.dataSources]].
 *
 * @param k8Deploy Kubernetes deployment goal
 * @param registration Goal registration/configuration for `k8Deploy`
 * @param goalInvocation The Kubernetes deployment goal currently triggered.
 * @return The SdmGoalEvent augmented with [[KubernetesApplication]] in the data
 */
export function generateKubernetesGoalEventData(
    k8Deploy: KubernetesDeploy,
    registration: KubernetesDeployRegistration,
    goalInvocation: GoalInvocation,
): Promise<SdmGoalEvent> {
    return k8Deploy.sdm.configuration.sdm.projectLoader.doWithProject({ ...goalInvocation, readOnly: true }, async p => {

        const { context, goalEvent } = goalInvocation;

        const sdmConfigAppData: Partial<KubernetesApplication> = (registration.dataSources.includes(KubernetesDeployDataSources.SdmConfiguration)) ?
            _.get(k8Deploy, "sdm.configuration.sdm.k8s.app", {}) : {};

        const defaultAppData: Partial<KubernetesApplication> = await defaultKubernetesApplication(goalEvent, k8Deploy, context);

        const dockerfileAppData: Partial<KubernetesApplication> = (registration.dataSources.includes(KubernetesDeployDataSources.Dockerfile)) ?
            await dockerfileKubernetesApplication(p) : {};

        const specAppData: Partial<KubernetesApplication> = await repoSpecsKubernetsApplication(p, registration);

        const mergedAppData = _.merge({ ns: K8sDefaultNamespace }, sdmConfigAppData, defaultAppData, dockerfileAppData, specAppData);

        const eventAppData: any = {};
        eventAppData[sdmPackK8s] = mergedAppData;

        if (registration.dataSources.includes(KubernetesDeployDataSources.GoalEvent)) {
            const slug = goalEventSlug(goalEvent);
            let eventData: any;
            try {
                eventData = JSON.parse(goalEvent.data || "{}");
            } catch (e) {
                logger.warn(`Failed to parse goal event data for ${slug} as JSON: ${e.message}`);
                logger.warn(`Ignoring current value of goal event data: ${goalEvent.data}`);
                eventData = {};
            }
            _.merge(eventAppData, eventData);
        }

        if (registration.applicationData) {
            const callbackAppData = await registration.applicationData(eventAppData[sdmPackK8s], p, k8Deploy, goalEvent, context);
            eventAppData[sdmPackK8s] = callbackAppData;
        }

        goalEvent.data = JSON.stringify(eventAppData);
        goalEvent.fulfillment = {
            method: "sdm",
            name: KubernetesDeployFulfillerGoalName,
            registration: registration.name,
        };
        return goalEvent;
    });
}

/**
 * Fetch [[KubernetesApplication]] from goal event.  If the goal event
 * does not contain Kubernetes application information in its data
 * property, `undefined` is returned.  If the value of the goal event
 * data cannot be parsed as JSON, an error is thrown.
 *
 * @param goalEvent SDM goal event to retrieve the Kubernetes application data from
 * @return Parsed [[KubernetesApplication]] object
 */
export function getKubernetesGoalEventData(goalEvent: SdmGoalEvent): KubernetesApplication | undefined {
    if (!goalEvent || !goalEvent.data) {
        return undefined;
    }
    let data: any;
    try {
        data = JSON.parse(goalEvent.data);
    } catch (e) {
        e.message = `Failed to parse goal event data (${goalEvent.data}): ${e.message}`;
        logger.error(e.message);
        throw e;
    }
    return data[sdmPackK8s];
}

/**
 * Given the goal event, [[KubernetesDeploy]] goal, and
 * handler context generate a default [[KubernetesApplication]] object.
 *
 * This function uses [[defaultImage]] to determine the image.
 *
 * @param goalEvent SDM Kubernetes deployment goal event
 * @param k8Deploy Kubernetes deployment goal configuration
 * @param context Handler context
 * @return a valid default KubernetesApplication for this SDM goal deployment event
 */
export async function defaultKubernetesApplication(
    goalEvent: SdmGoalEvent,
    k8Deploy: KubernetesDeploy,
    context: HandlerContext,
): Promise<Partial<KubernetesApplication>> {

    const workspaceId = context.workspaceId;
    const name = validName(goalEvent.repo.name);
    const image = await defaultImage(goalEvent, k8Deploy, context);
    return {
        workspaceId,
        name,
        image,
    };
}

/**
 * Parse Dockerfile and return port of first argument to the first
 * EXPOSE command.  it can suggessfully convert to an integer.  If
 * there are no EXPOSE commands or if it cannot successfully convert
 * the EXPOSE arguments to an integer, `undefined` is returned.
 *
 * @param p Project to look for Dockerfile in
 * @return port number or `undefined` if no EXPOSE commands are found
 */
export async function dockerPort(p: Project): Promise<number | undefined> {
    const dockerFile = await p.getFile("Dockerfile");
    if (dockerFile) {
        const dockerFileContents = await dockerFile.getContent();
        const commands = dockerfileParser.parse(dockerFileContents, { includeComments: false });
        const exposeCommands = commands.filter(c => c.name === "EXPOSE");
        for (const exposeCommand of exposeCommands) {
            if (Array.isArray(exposeCommand.args)) {
                for (const arg of exposeCommand.args) {
                    const port = parseInt(arg, 10);
                    if (!isNaN(port)) {
                        return port;
                    }
                }
            } else if (typeof exposeCommand.args === "string") {
                const port = parseInt(exposeCommand.args, 10);
                if (!isNaN(port)) {
                    return port;
                }
            } else {
                logger.warn(`Unexpected EXPOSE argument type '${typeof exposeCommand.args}': ${stringify(exposeCommand.args)}`);
            }
        }
    }
    return undefined;
}

/** Package return of [[dockerPort]] in [[KubernetesApplication]]. */
async function dockerfileKubernetesApplication(p: Project): Promise<Partial<KubernetesApplication>> {
    const port = await dockerPort(p);
    return (port) ? { port } : {};
}

/**
 * Read configured Kubernetes partial specs from repository.
 *
 * @param p Project to look for specs
 * @param registration Configuration of KubernetesDeploy goal
 * @return KubernetesApplication object with requested specs populated
 */
export async function repoSpecsKubernetsApplication(p: Project, r: KubernetesDeployRegistration): Promise<Partial<KubernetesApplication>> {
    const deploymentSpec: DeepPartial<k8s.V1Deployment> = (r.dataSources.includes(KubernetesDeployDataSources.DeploymentSpec)) ?
        await loadKubernetesSpec(p, "deployment") : undefined;
    const serviceSpec: DeepPartial<k8s.V1Service> = (r.dataSources.includes(KubernetesDeployDataSources.ServiceSpec)) ?
        await loadKubernetesSpec(p, "service") : undefined;
    const ingressSpec: DeepPartial<k8s.NetworkingV1beta1Ingress> = (r.dataSources.includes(KubernetesDeployDataSources.IngressSpec)) ?
        await loadKubernetesSpec(p, "ingress") : undefined;
    const roleSpec: DeepPartial<k8s.V1Role> = (r.dataSources.includes(KubernetesDeployDataSources.RoleSpec)) ?
        await loadKubernetesSpec(p, "role") : undefined;
    const serviceAccountSpec: DeepPartial<k8s.V1ServiceAccount> = (r.dataSources.includes(KubernetesDeployDataSources.ServiceAccountSpec)) ?
        await loadKubernetesSpec(p, "service-account") : undefined;
    const roleBindingSpec: DeepPartial<k8s.V1RoleBinding> = (r.dataSources.includes(KubernetesDeployDataSources.RoleBindingSpec)) ?
        await loadKubernetesSpec(p, "role-binding") : undefined;

    return {
        deploymentSpec,
        serviceSpec,
        ingressSpec,
        roleSpec,
        serviceAccountSpec,
        roleBindingSpec,
    };
}

/**
 * Remove any invalid characters from Docker image name component
 * `name` to make it a valid Docker image name component.  If
 * `hubOwner` is true, it ensures the name contains only alphanumeric
 * characters.
 *
 * From https://docs.docker.com/engine/reference/commandline/tag/:
 *
 * > An image name is made up of slash-separated name components,
 * > optionally prefixed by a registry hostname. The hostname must
 * > comply with standard DNS rules, but may not contain
 * > underscores. If a hostname is present, it may optionally be
 * > followed by a port number in the format :8080. If not present,
 * > the command uses Docker’s public registry located at
 * > registry-1.docker.io by default. Name components may contain
 * > lowercase letters, digits and separators. A separator is defined
 * > as a period, one or two underscores, or one or more dashes. A
 * > name component may not start or end with a separator.
 * >
 * > A tag name must be valid ASCII and may contain lowercase and
 * > uppercase letters, digits, underscores, periods and dashes. A tag
 * > name may not start with a period or a dash and may contain a
 * > maximum of 128 characters.
 *
 * @param name Name component to clean up.
 * @param hubOwner If `true` only allow characters valid for a Docker Hub user/org
 * @return Valid Docker image name component.
 */
function dockerImageNameComponent(name: string, hubOwner: boolean = false): string {
    const cleanName = name.toLocaleLowerCase()
        .replace(/^[^a-z0-9]+/, "")
        .replace(/[^a-z0-9]+$/, "")
        .replace(/[^-_/.a-z0-9]+/g, "");
    if (hubOwner) {
        return cleanName.replace(/[^a-z0-9]+/g, "");
    } else {
        return cleanName;
    }
}

/**
 * Determine the best default value for the image property for this
 * Kubernetes deployment goal event.  If there is no image associated
 * with the after commit of the push, it checks if a Docker registry
 * is provided at `sdm.configuration.sdm.docker.registry` and uses
 * that and the repo name to return an image.  If neither of those
 * exist, a Docker Hub-like image name generated from the repository
 * owner and name.  In the latter two cases, it tries to read a
 * version for this commit from the graph.  If it exists it uses it at
 * the image tag.  If it does not, it uses the tag "latest".
 *
 * @param goalEvent SDM Kubernetes deployment goal event
 * @param k8Deploy Kubernetes deployment goal object
 * @param context Handler context
 * @return Docker image associated with goal push after commit, or best guess
 */
export async function defaultImage(goalEvent: SdmGoalEvent, k8Deploy: KubernetesDeploy, context: HandlerContext): Promise<string> {
    if (goalEvent.push && goalEvent.push.after && goalEvent.push.after.images && goalEvent.push.after.images.length > 0) {
        return goalEvent.push.after.images[0].imageName;
    }
    const slug = goalEventSlug(goalEvent);
    let version: string;
    try {
        version = await readSdmVersion(goalEvent.repo.owner, goalEvent.repo.name, goalEvent.repo.providerId, goalEvent.sha,
            goalEvent.branch, context);
    } catch (e) {
        logger.warn(`Failed to read version for goal ${slug}:${goalEvent.sha}: ${e.message}`);
    }
    if (!version) {
        version = "latest";
    }
    const tag = version.replace(/^[-.]/, "").replace(/[^-.\w]+/, "").substring(0, 128);
    const dockerName = dockerImageNameComponent(goalEvent.repo.name);
    const registry = _.get(k8Deploy, "sdm.configuration.sdm.build.docker.registry", dockerImageNameComponent(goalEvent.repo.owner, true));
    return `${registry}/${dockerName}:${tag}`;
}
