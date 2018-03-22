/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    EventFired,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitHubStatusAndFriends } from "../../../common/delivery/goals/gitHubContext";
import {
    currentGoalIsStillPending,
    Goal,
} from "../../../common/delivery/goals/Goal";
import {
    ExecuteGoalInvocation,
    ExecuteGoalResult,
    GoalExecutor,
    StatusForExecuteGoal,
} from "../../../common/delivery/goals/goalExecution";
import { OnAnySuccessStatus } from "../../../typings/types";
import { createStatus } from "../../../util/github/ghub";

/**
 * Execute a goal on a success status
 */
export class ExecuteGoalOnSuccessStatus
    implements HandleEvent<OnAnySuccessStatus.Subscription>,
        ExecuteGoalInvocation,
        EventHandlerMetadata {

    public subscriptionName: string;
    public subscription: string;
    public name: string;
    public description: string;
    public secrets = [{name: "githubToken", uri: Secrets.OrgToken}];

    public githubToken: string;

    constructor(public implementationName: string,
                public goal: Goal,
                private execute: GoalExecutor) {
        this.subscriptionName = implementationName + "OnSuccessStatus";
        this.name = implementationName + "OnSuccessStatus";
        this.description = `Execute ${goal.name} on prior goal success`;
        this.subscription =
            subscription({ name: "OnAnySuccessStatus", operationName: this.subscriptionName });
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        return executeGoal(this.execute, status, ctx, params).then(handleExecuteResult);
    }
}

export async function executeGoal(execute: GoalExecutor,
                                  status: StatusForExecuteGoal.Status,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation): Promise<ExecuteGoalResult> {
    const commit = status.commit;
    logger.debug(`Might execute ${params.goal.name} on ${params.implementationName} after receiving ${status.state} status ${status.context}`);
    const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
    const statusAndFriends: GitHubStatusAndFriends = {
        context: status.context,
        state: status.state,
        targetUrl: status.targetUrl,
        description: status.description,
        siblings: status.commit.statuses,
    };
    logger.debug("Checking preconditions for goal %s on %j...", params.goal.name, id);
    const preconsStatus = await params.goal.preconditionsStatus({token: params.githubToken}, id, statusAndFriends);
    if (preconsStatus === "failure") {
        logger.info("Preconditions failed for goal %s on %j", params.goal.name, id);
        createStatus(params.githubToken, id as GitHubRepoRef, {
            context: params.goal.context,
            description: params.goal.workingDescription,
            state: "failure",
        });
        return Success;
    }
    if (preconsStatus === "waiting") {
        logger.debug("Preconditions not yet met for goal %s on %j", params.goal.name, id);
        return Success;
    }
    if (!currentGoalIsStillPending(params.goal.context, statusAndFriends)) {
        return Success;
    }

    logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
    await createStatus(params.githubToken, id as GitHubRepoRef, {
        context: params.goal.context,
        description: params.goal.workingDescription,
        state: "pending",
    }).catch(err =>
        logger.warn("Failed to update %s status to tell people we are working on it", params.goal.name));
    return execute(status, ctx, params);
}

async function handleExecuteResult(executeResult: ExecuteGoalResult): Promise<HandlerResult> {
    // Return the minimal fields for HandlerResult, because they get printed to the log.
    return {code: executeResult.code, message: executeResult.message};
}
