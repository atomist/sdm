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

import { EventFired, HandleEvent, HandlerContext, HandlerResult, logger, Secrets, Success, } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitHubStatusAndFriends } from "../../../common/delivery/goals/gitHubContext";
import { currentGoalIsStillPending, Goal, } from "../../../common/delivery/goals/Goal";
import { ExecuteGoalInvocation, ExecuteGoalResult, GoalExecutor, } from "../../../common/delivery/goals/goalExecution";
import { OnAnySuccessStatus, StatusForExecuteGoal } from "../../../typings/types";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { goalCorrespondsToSdmGoal } from "../../../common/delivery/goals/storeGoals";
import { fetchGoalsForCommit } from "../../../common/delivery/goals/fetchGoalsOnCommit";
import { providerIdFromStatus } from "../../../util/git/repoRef";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { executeGoal, validSubscriptionName } from "./verify/executeGoal";

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
    public readonly implementationName: string;

    constructor(implementationName: string,
                public goal: Goal,
                private execute: GoalExecutor,
                private handleGoalUpdates: boolean = false) {
        this.implementationName = validSubscriptionName(implementationName);
        this.subscriptionName = this.implementationName + "OnSuccessStatus";
        this.name = this.subscriptionName + "OnSuccessStatus";
        this.description = `Execute ${goal.name} on prior goal success`;
        this.subscription =
            subscription({name: "OnAnySuccessStatus", operationName: this.subscriptionName});
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];

        logger.debug(`Might execute ${params.goal.name} on ${params.implementationName} after receiving ${status.state} status ${status.context}`);

        if (!currentGoalIsStillPending(params.goal.context, {
                siblings: status.commit.statuses,
            })) {
            return Success;
        }

        const commit = status.commit;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        if (!(await preconditionsAreAllMet(params.goal, status, id))) {
            return Success;
        }

        return dedup(dontRunTheSameGoalTwiceSimultaneously(commit.sha, params.goal),async () => {
            logger.info("Really executing " + this.implementationName);

            if (!params.handleGoalUpdates) {
                // do this simplest thing. Not recommended. in progress: #264
                return params.execute(status, ctx, params)
            }

            const sdmGoals = await fetchGoalsForCommit(ctx, id, providerIdFromStatus(status));
            const thisSdmGoal = sdmGoals.find(g => goalCorrespondsToSdmGoal(params.goal, g as SdmGoal));
            if (!thisSdmGoal) {
                throw new Error("Unable to identify SdmGoal for " + params.goal.name)
            }

            return executeGoal(this.execute, status, ctx, params, thisSdmGoal as SdmGoal).then(handleExecuteResult);
        });
    }
}

function dontRunTheSameGoalTwiceSimultaneously(sha: string, goal: Goal) {
    return `${goal.environment}/${goal.name} for ${sha}`
}

async function dedup(key: string, f: () => Promise<HandlerResult>): Promise<HandlerResult> {
    if (running[key]) {
        logger.warn("Dedup: skipping second simultaneous execution of " + key);
        return Promise.resolve(Success);
    }
    running[key] = true;
    const promise = f().then(t => {
        running[key] = undefined;
        return t;
    });
    return promise;
}

const running = {};

async function preconditionsAreAllMet(goal: Goal, status: StatusForExecuteGoal.Fragment, idForLogging: RepoRef) {
    const statusAndFriends: GitHubStatusAndFriends = {
        context: status.context,
        state: status.state,
        targetUrl: status.targetUrl,
        description: status.description,
        siblings: status.commit.statuses,
    };
    logger.debug("Checking preconditions for goal %s on %j...", goal.name, idForLogging);
    const preconsStatus = await goal.preconditionsStatus(idForLogging, statusAndFriends);
    if (preconsStatus === "failure") {
        logger.info("Preconditions failed for goal %s on %j", goal.name, idForLogging);
        logger.warn("Cannot run %s because some precondition failed", goal.name);
        return false;
    }
    if (preconsStatus === "waiting") {
        logger.debug("Preconditions not yet met for goal %s on %j", goal.name, idForLogging);
        return false;
    }
    return true;
}

async function handleExecuteResult(executeResult: ExecuteGoalResult): Promise<HandlerResult> {
    // Return the minimal fields for HandlerResult, because they get printed to the log.
    return {code: executeResult.code, message: executeResult.message};
}
