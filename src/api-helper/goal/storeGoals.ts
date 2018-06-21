/*
 * Copyright © 2018 Atomist, Inc.
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

import { AutomationContextAware, HandlerContext, logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import * as _ from "lodash";
import { sprintf } from "sprintf-js";
import { Goal, hasPreconditions } from "../../api/goal/Goal";
import {
    GoalRootType, SdmGoal, SdmGoalFulfillment, SdmGoalKey, SdmGoalState,
    SdmProvenance,
} from "../../api/goal/SdmGoal";
import { disregardApproval } from "../../api/goal/support/approvalGate";
import { GoalImplementation } from "../../api/goal/support/SdmGoalImplementationMapper";

export function environmentFromGoal(goal: Goal) {
    return goal.definition.environment.replace(/\/$/, ""); // remove trailing slash at least
}

export interface UpdateSdmGoalParams {
    state: SdmGoalState;
    description: string;
    url?: string;
    approved?: boolean;
    error?: Error;
    data?: string;
}

export function updateGoal(ctx: HandlerContext, before: SdmGoal, params: UpdateSdmGoalParams) {
    const description = params.description;
    const approval = params.approved ? constructProvenance(ctx) :
        !!before ? before.approval : undefined;
    const data = params.data ?
        params.data :
        !!before ? before.data : undefined;
    const sdmGoal = {
        ...before,
        state: params.state === "success" && !!before && before.approvalRequired ? "waiting_for_approval" : params.state,
        description,
        url: params.url,
        approval,
        ts: Date.now(),
        provenance: [constructProvenance(ctx)].concat(!!before ? before.provenance : []),
        error: _.get(params, "error.message"),
        data,
    };
    logger.debug("Updating SdmGoal %s to %s: %j", sdmGoal.externalKey, sdmGoal.state, sdmGoal);
    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType));
}

export function goalCorrespondsToSdmGoal(goal: Goal, sdmGoal: SdmGoal): boolean {
    return goal.name === sdmGoal.name && environmentFromGoal(goal) === sdmGoal.environment;
}

export function constructSdmGoalImplementation(gi: GoalImplementation): SdmGoalFulfillment {
    return {
        method: "SDM fulfill on requested",
        name: gi.implementationName,
    };
}

export function constructSdmGoal(ctx: HandlerContext, parameters: {
    goalSet: string,
    goalSetId: string,
    goal: Goal,
    state: SdmGoalState,
    id: RemoteRepoRef,
    providerId: string
    url?: string,
    fulfillment?: SdmGoalFulfillment,
}): SdmGoal {
    const {goalSet, goal, goalSetId, state, id, providerId, url} = parameters;
    const fulfillment = parameters.fulfillment || {method: "other", name: "unspecified"};

    if (!id.branch) {
        throw new Error(sprintf("Please provide a branch in the RemoteRepoRef %j", parameters));
    }
    if (!id.sha) {
        throw new Error(sprintf("Please provide a sha in the RemoteRepoRef %j", parameters));
    }

    const preConditions: SdmGoalKey[] = [];
    const description = descriptionFromState(goal, state);
    const environment = environmentFromGoal(goal);
    if (hasPreconditions(goal)) {
        preConditions.push(...goal.dependsOn.map(d => ({
            goalSet,
            name: d.name,
            environment: environmentFromGoal(d),
        })));
    }

    return {
        goalSet,
        goalSetId,
        name: goal.name,
        uniqueName: goal.definition.uniqueName,
        environment,
        fulfillment,
        sha: id.sha,
        branch: id.branch,
        repo: {
            name: id.repo,
            owner: id.owner,
            providerId,
        },
        state,
        description,
        url: disregardApproval(url), // when we use goals in lifecycle this can go
        externalKey: goal.context,
        ts: Date.now(),
        approvalRequired: goal.definition.approvalRequired ? goal.definition.approvalRequired : false,
        retryFeasible: goal.definition.retryFeasible ? goal.definition.retryFeasible : false,
        provenance: [constructProvenance(ctx)],
        preConditions,
    };
}

export function storeGoal(ctx: HandlerContext, sdmGoal: SdmGoal) {
    logger.info("Storing goal: %j", sdmGoal);
    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType))
        .then(() => sdmGoal);
}

function constructProvenance(ctx: HandlerContext): SdmProvenance {
    return {
        registration: (ctx as any as AutomationContextAware).context.name,
        version: (ctx as any as AutomationContextAware).context.version,
        name: (ctx as any as AutomationContextAware).context.operation,
        correlationId: ctx.correlationId,
        ts: Date.now(),
    };
}

export function descriptionFromState(goal: Goal, state: SdmGoalState): string {
    switch (state) {
        case "planned":
        case "requested":
            return goal.requestedDescription;
        case "in_process":
            return goal.inProcessDescription;
        case "waiting_for_approval":
            return goal.waitingForApprovalDescription;
        case "success":
            return goal.successDescription;
        case "failure":
            return goal.failureDescription;
        case "skipped":
            return "Skipped"; // you probably want to use something that describes the reason instead. but don't error.
        default:
            throw new Error("Unknown goal state " + state);
    }
}
