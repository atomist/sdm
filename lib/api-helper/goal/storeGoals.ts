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

import {
    addressEvent,
    AutomationContextAware,
    HandlerContext,
    RemoteRepoRef,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { sprintf } from "sprintf-js";
import {
    Goal,
    hasPreconditions,
} from "../../api/goal/Goal";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import {
    GoalRootType,
    SdmGoalFulfillment,
    SdmGoalFulfillmentMethod,
    SdmGoalKey,
    SdmGoalMessage,
    SdmProvenance,
} from "../../api/goal/SdmGoalMessage";
import {
    GoalSetRootType,
    SdmGoalSetMessage,
} from "../../api/goal/SdmGoalSetMessage";
import { GoalImplementation } from "../../api/goal/support/GoalImplementationMapper";
import {
    OnAnyRequestedSdmGoal,
    OnPushToAnyBranch,
    SdmGoalState,
} from "../../typings/types";

export function environmentFromGoal(goal: Goal) {
    return goal.definition.environment.replace(/\/$/, ""); // remove trailing slash at least
}

export interface UpdateSdmGoalParams {
    state: SdmGoalState;
    description: string;
    url?: string;
    externalUrls?: Array<{ label?: string, url: string }>;
    approved?: boolean;
    error?: Error;
    data?: string;
    phase?: string;
}

export function updateGoal(ctx: HandlerContext,
                           before: SdmGoalEvent,
                           params: UpdateSdmGoalParams): Promise<void> {
    const description = params.description;
    const approval = params.approved ? constructProvenance(ctx) :
        !!before ? before.approval : undefined;
    const data = params.data ?
        params.data :
        !!before ? before.data : undefined;
    const sdmGoal: SdmGoalMessage = {
        ...eventToMessage(before),
        state: params.state === "success" && !!before && before.approvalRequired ? "waiting_for_approval" : params.state,
        phase: params.phase,
        description,
        url: params.url ? params.url : before.url,
        externalUrls: params.externalUrls ? params.externalUrls : before.externalUrls,
        approval,
        ts: Date.now(),
        provenance: [constructProvenance(ctx)].concat(!!before ? before.provenance : []),
        error: _.get(params, "error.message"),
        data,
        push: before.push,
        version: before.version + 1,
    } as SdmGoalMessage;
    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType));
}

function eventToMessage(event: SdmGoalEvent): SdmGoalMessage {
    return {
        ...event,
        repo: {
            name: event.push.repo.name,
            owner: event.push.repo.owner,
            providerId: event.push.repo.org.provider.providerId,
        },
        id: undefined,
    } as SdmGoalMessage;
}

export function goalCorrespondsToSdmGoal(goal: Goal, sdmGoal: SdmGoalKey): boolean {
    return goal.name === sdmGoal.name && environmentFromGoal(goal) === sdmGoal.environment;
}

export function constructSdmGoalImplementation(gi: GoalImplementation): SdmGoalFulfillment {
    return {
        method: SdmGoalFulfillmentMethod.Sdm,
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
}): SdmGoalMessage {
    const { goalSet, goal, goalSetId, state, id, providerId, url } = parameters;
    const fulfillment = parameters.fulfillment || { method: SdmGoalFulfillmentMethod.Other, name: "unknown" };

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
            uniqueName: d.uniqueName,
            environment: environmentFromGoal(d),
        })));
    }

    return {
        goalSet,
        goalSetId,
        name: goal.name,
        uniqueName: goal.uniqueName,
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
        url,
        externalKey: goal.context,
        ts: Date.now(),
        approvalRequired: goal.definition.approvalRequired ? goal.definition.approvalRequired : false,
        preApprovalRequired: goal.definition.preApprovalRequired ? goal.definition.preApprovalRequired : false,
        retryFeasible: goal.definition.retryFeasible ? goal.definition.retryFeasible : false,
        provenance: [constructProvenance(ctx)],
        preConditions,
        version: 1,
    };
}

export function storeGoal(ctx: HandlerContext, sdmGoal: SdmGoalMessage, push: OnPushToAnyBranch.Push) {
    (sdmGoal as OnAnyRequestedSdmGoal.SdmGoal).push = push;
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
        case SdmGoalState.planned:
            return goal.plannedDescription;
        case SdmGoalState.requested:
            return goal.requestedDescription;
        case SdmGoalState.in_process:
            return goal.inProcessDescription;
        case SdmGoalState.waiting_for_approval:
            return goal.waitingForApprovalDescription;
        case SdmGoalState.waiting_for_pre_approval:
            return goal.waitingForPreApprovalDescription;
        case SdmGoalState.success:
            return goal.successDescription;
        case SdmGoalState.failure:
            return goal.failureDescription;
        case SdmGoalState.skipped:
            return goal.skippedDescription;
        case SdmGoalState.canceled:
            return goal.canceledDescription;
        case SdmGoalState.stopped:
            return goal.stoppedDescription;
        default:
            throw new Error("Unknown goal state " + state);
    }
}

export async function storeGoalSet(ctx: HandlerContext,
                                   goalSetId: string,
                                   goalSet: string,
                                   sdmGoals: SdmGoalMessage[],
                                   push: OnPushToAnyBranch.Push): Promise<any> {
    const sdmGoalSet: SdmGoalSetMessage = {
        sha: push.after.sha,
        branch: push.branch,
        goalSetId,
        goalSet,
        ts: Date.now(),
        repo: {
            name: push.repo.name,
            owner: push.repo.owner,
            providerId: push.repo.org.provider.providerId,
        },
        goals: sdmGoals.map(g => ({
            name: g.name,
            uniqueName: g.uniqueName,
        })),
        provenance: constructProvenance(ctx),
    };
    return ctx.messageClient.send(sdmGoalSet, addressEvent(GoalSetRootType));
}
