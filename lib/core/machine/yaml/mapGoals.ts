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

import { resolvePlaceholders } from "@atomist/automation-client/lib/configuration";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { isTokenCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { HttpMethod } from "@atomist/automation-client/lib/spi/http/httpClient";
import * as yaml from "js-yaml";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { RepoContext } from "../../../api/context/SdmContext";
import { StatefulPushListenerInvocation } from "../../../api/dsl/goalContribution";
import { Cancel } from "../../../api/goal/common/Cancel";
import { ImmaterialGoals } from "../../../api/goal/common/Immaterial";
import { Locking } from "../../../api/goal/common/Locking";
import { Queue } from "../../../api/goal/common/Queue";
import { Goal } from "../../../api/goal/Goal";
import { GoalWithFulfillment } from "../../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { PushTest } from "../../../api/mapping/PushTest";
import { allSatisfied } from "../../../api/mapping/support/pushTestUtils";
import {
    cachePut,
    cacheRestore,
} from "../../goal/cache/goalCaching";
import { skill } from "../../goal/common/skill";
import { action } from "../../goal/container/action";
import {
    container,
    Container,
    ContainerProgressReporter,
    ContainerRegistration,
    ContainerSpecCallback,
    GoalContainerSpec,
} from "../../goal/container/container";
import { execute } from "../../goal/container/execute";
import { toArray } from "../../util/misc/array";
import { DeliveryGoals } from "../configure";
import {
    mapTests,
    PushTestMaker,
} from "./mapPushTests";
import { resolvePlaceholder } from "./resolvePlaceholder";
import { camelCase } from "./util";

// tslint:disable:max-file-line-count

export type GoalMaker<G extends Record<string, any> = {}> =
    (sdm: SoftwareDeliveryMachine, params: G) => Promise<Goal> | Goal;

type MapGoal = (goals: any,
                sdm: SoftwareDeliveryMachine,
                additionalGoals: DeliveryGoals,
                goalMakers: Record<string, GoalMaker>,
                additionalTests: Record<string, PushTest>,
                extensionTests: Record<string, PushTestMaker>) => Promise<Goal | Goal[]>;

const MapContainer: MapGoal = async (goals: any,
                                     sdm: SoftwareDeliveryMachine,
                                     additionalGoals: DeliveryGoals,
                                     goalMakers: Record<string, GoalMaker>,
                                     additionalTests: Record<string, PushTest>,
                                     extensionTests: Record<string, PushTestMaker>) => {
    if (!!goals.containers) {

        if (!goals.name) {
            throw new Error(`Property 'name' missing on container goal:\n${JSON.stringify(goals, undefined, 2)}`);
        }

        const containers = [];
        for (const gc of goals.containers) {
            containers.push({
                ...gc,
                name: gc.name.replace(/ /g, "-"),
                test: !!gc.test ? await mapTests(gc.test, additionalTests, extensionTests) : undefined,
            });
        }
        const g = container(
            goals.name,
            {
                callback: containerCallback(),
                containers,
                initContainers: goals.initContainers,
                volumes: toArray(goals.volumes),
                progressReporter: ContainerProgressReporter,
                input: goals.input,
                output: goals.output,
                parameters: goals.parameters,
                fulfillment: goals.fulfillment,
            });
        return g;
    }

    return undefined;
};

const MapExecute: MapGoal = async goals => {
    if (!!goals.execute) {

        if (!goals.name) {
            throw new Error(`Property 'name' missing on execute goal:\n${JSON.stringify(goals, undefined, 2)}`);
        }

        const g = goals.execute;
        return execute(g.name, {
            cmd: g.command || g.cmd,
            args: toArray(g.args),
            secrets: g.secrets,
        });
    }

    return undefined;
};

const MapImmaterial: MapGoal = async goals => {
    if (goals.use === "immaterial") {
        return ImmaterialGoals.andLock().goals;
    }
    return undefined;
};

const MapLock: MapGoal = async goals => {
    if (goals.use === "lock") {
        return Locking;
    }
    return undefined;
};

const MapQueue: MapGoal = async goals => {
    if (goals.use === "queue") {
        return new Queue({
            fetch: goals.fetch,
            concurrent: goals.concurrent,
        });
    }
    return undefined;
};

const MapCancel: MapGoal = async goals => {
    if (goals.use === "cancel") {
        return new Cancel({ goals: [], goalNames: toArray(goals.goals) });
    }
    return undefined;
};

const MapAdditional: MapGoal = async (goals: any,
                                      sdm: SoftwareDeliveryMachine,
                                      additionalGoals: DeliveryGoals) => {
    if (!!additionalGoals[goals.use]) {
        return additionalGoals[goals.use];
    }
    return undefined;
};

const MapReferenced: MapGoal = async (goals: any,
                                      sdm: SoftwareDeliveryMachine,
                                      additionalGoals: DeliveryGoals,
                                      goalMakers: Record<string, GoalMaker>,
                                      additionalTests: Record<string, PushTest>,
                                      extensionTests: Record<string, PushTestMaker>) => {
    const ref = goals.ref;
    if (!!ref && ref.includes("/")) {
        const parameters = goals.parameters || {};
        const referencedGoal = await mapReferencedGoal(sdm, ref, parameters);
        if (!!referencedGoal) {
            return mapGoals(
                sdm,
                _.merge({}, referencedGoal, (goals || {})),
                additionalGoals,
                goalMakers,
                additionalTests,
                extensionTests);
        }
    }

    return undefined;
};

const MapGoalMakers: MapGoal = async (goals: any,
                                      sdm: SoftwareDeliveryMachine,
                                      additionalGoals: DeliveryGoals,
                                      goalMakers: Record<string, GoalMaker>) => {

    const use = goals.use;
    if (!!use && !!goalMakers[use]) {
        const goalMaker = goalMakers[use];
        try {
            return goalMaker(sdm, (goals.parameters || {})) as any;
        } catch (e) {
            e.message = `Failed to make goal using ${use}: ${e.message}`;
            throw e;
        }
    }
    return undefined;
};

const MapFulfillment: MapGoal = async (goals: any) => {
    const regexp = /([@a-zA-Z-_]*)\/([a-zA-Z-_]*)(?:\/([a-zA-Z-_]*))?@?([a-zA-Z-_0-9\.]*)/i;
    const use = goals.use;

    if (!!use) {
        const match = regexp.exec(use);
        if (!!match) {
            return skill(
                match[3].replace(/_/g, " "),
                `${match[1]}/${match[2]}`,
                {
                    uniqueName: goals.name || match[3],
                    parameters: goals.parameters,
                    input: goals.input,
                    output: goals.output,
                    secrets: goals.secrets,
                });
        }
    }

    return undefined;
};

const MapAction: MapGoal = async (goals: any) => {

    if (!!goals.action) {

        return action({
            name: goals.name,
            image: goals.action,
            input: goals.input,
            output: goals.output,
            parameters: goals.parameters,
            secrets: goals.secrets,
        });

    }

    return undefined;
};

const MapGoals = [
    MapContainer,
    MapExecute,
    MapImmaterial,
    MapLock,
    MapCancel,
    MapQueue,
    MapAdditional,
    MapGoalMakers,
    MapReferenced,
    MapFulfillment,
    MapAction,
];

export async function mapGoals(sdm: SoftwareDeliveryMachine,
                               goals: any,
                               additionalGoals: DeliveryGoals,
                               goalMakers: Record<string, GoalMaker>,
                               additionalTests: Record<string, PushTest>,
                               extensionTests: Record<string, PushTestMaker>): Promise<Goal | Goal[]> {
    if (Array.isArray(goals)) {
        const newGoals: any[] = [];
        for (const g of toArray(goals)) {
            newGoals.push(await mapGoals(sdm, g, additionalGoals, goalMakers, additionalTests, extensionTests));
        }
        return newGoals;
    } else {
        let goal;
        for (const mapGoal of MapGoals) {
            goal = await mapGoal(goals, sdm, additionalGoals, goalMakers, additionalTests, extensionTests);
            if (!!goal) {
                if (!Array.isArray(goal)) {
                    addDetails(goal, goals);

                    // Container goal handle their own caching
                    if (!(goal instanceof Container)) {
                        addCaching(goal, goals);
                    }
                }
                return goal;
            }
        }
    }

    throw new Error(`Unable to construct goal from '${stringify(goals)}'`);
}

function addDetails(goal: Goal, goals: any): Goal {
    (goal as any).definition = _.cloneDeep(goal.definition);
    if (goals.approval !== undefined) {
        goal.definition.approvalRequired = goals.approval;
    }
    if (goals.preApproval !== undefined) {
        goal.definition.preApprovalRequired = goals.preApproval;
    }
    if (goals.retry !== undefined) {
        goal.definition.retryFeasible = goals.retry;
    }
    if (!!goals.descriptions) {
        const descriptions = goals.descriptions;
        goal.definition.canceledDescription = descriptions.canceled;
        goal.definition.completedDescription = descriptions.completed;
        goal.definition.failedDescription = descriptions.failed;
        goal.definition.plannedDescription = descriptions.planned;
        goal.definition.requestedDescription = descriptions.requested;
        goal.definition.stoppedDescription = descriptions.stopped;
        goal.definition.waitingForApprovalDescription = descriptions.waitingForApproval;
        goal.definition.waitingForPreApprovalDescription = descriptions.waitingForPreApproval;
        goal.definition.workingDescription = descriptions.inProcess;
    }
    return goal;
}

function addCaching(goal: GoalWithFulfillment, goals: any): GoalWithFulfillment {
    if (!!goals?.input) {
        goal.withProjectListener(cacheRestore({ entries: toArray(goals.input) }));
    }
    if (!!goals?.output) {
        goal.withProjectListener(cachePut({ entries: toArray(goals.output) }));
    }
    return goal;
}

function containerCallback(): ContainerSpecCallback {
    return async (r, p, g, e, ctx) => {
        const pli: StatefulPushListenerInvocation = {
            ...ctx,
            push: e.push,
            project: p,
        };
        const containersToRemove = [];
        for (const gc of r.containers) {
            let test;
            if (Array.isArray((gc as any).test)) {
                test = allSatisfied(...(gc as any).test);
            } else {
                test = (gc as any).test;
            }
            if (!!test && !(await test.mapping(pli))) {
                containersToRemove.push(gc);
            }
        }
        const registration: ContainerRegistration = {
            ...r,
            containers: r.containers.filter(c => !containersToRemove.includes(c)),
        };
        return resolvePlaceholderContainerSpecCallback(registration, p, g, e, ctx);
    };
}

async function mapReferencedGoal(sdm: SoftwareDeliveryMachine,
                                 goalRef: string,
                                 parameters: Record<string, any>): Promise<any> {
    const regexp = /([a-zA-Z-_]*)\/([a-zA-Z-_]*)(?:\/([a-zA-Z-_]*))?@?([a-zA-Z-_0-9\.]*)/i;
    const match = regexp.exec(goalRef);
    if (!match) {
        return undefined;
    }

    const owner = match[1];
    const repo = match[2];
    const goalName = match[3];
    const goalNames = !!goalName ? [goalName] : [repo, repo.replace(/-goal/, "")];
    const ref = match[4] || "master";

    // Check if we have a github token to authenticate our requests
    let token = sdm.configuration?.sdm?.github?.token || sdm.configuration?.sdm?.goal?.yaml?.token;
    if (!token) {
        const workspaceId = _.get(sdm.configuration, "workspaceIds[0]");
        if (!!workspaceId) {
            try {
                const creds = await sdm.configuration.sdm.credentialsResolver.eventHandlerCredentials(
                    { graphClient: sdm.configuration.graphql.client.factory.create(workspaceId, sdm.configuration) } as any, GitHubRepoRef.from({
                        owner: undefined,
                        repo,
                    }));
                if (!!creds && isTokenCredentials(creds)) {
                    token = creds.token;
                    _.set(sdm.configuration, "sdm.goal.yaml.token", token);
                }
            } catch (e) {
                // Intentionally ignore that error here
            }
        }
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/goal.yaml?ref=${ref}`;

    try {
        const cacheKey = `configuration.sdm.goal.definition.cache[${url}]`;
        const cachedDocuments = _.get(sdm, cacheKey);
        let documents;

        if (!!cachedDocuments) {
            documents = cachedDocuments;
        } else {
            const client = sdm.configuration.http.client.factory.create(url);
            const response = await client.exchange<{ content: string }>(url, {
                method: HttpMethod.Get,
                headers: {
                    ...(!!token ? { Authorization: `Bearer ${token}` } : {}),
                },
                retry: { retries: 0 },
            });
            const content = Buffer.from(response.body.content, "base64").toString();
            documents = yaml.safeLoadAll(content);
            _.set(sdm, cacheKey, documents);
        }

        for (const document of documents) {
            for (const key in document) {
                if (document.hasOwnProperty(key) && goalNames.includes(key)) {
                    const pdg = document[key];
                    await resolvePlaceholders(pdg,
                        value => resolvePlaceholder(value, undefined, {} as any, parameters, false));
                    return camelCase(pdg);
                }
            }
        }
    } catch (e) {
        throw new Error(`Referenced goal '${goalRef}' can not be created: ${e.message}`);
    }
    return undefined;
}

async function resolvePlaceholderContainerSpecCallback(r: ContainerRegistration,
                                                       p: GitProject,
                                                       g: Container,
                                                       e: SdmGoalEvent,
                                                       ctx: RepoContext): Promise<GoalContainerSpec> {
    await resolvePlaceholders(r as any, value => resolvePlaceholder(value, e, ctx, (ctx as any).parameters));
    return r;
}
