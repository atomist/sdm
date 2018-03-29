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

import { failure, HandlerContext, logger, Success } from "@atomist/automation-client";
import { Goal } from "../../../../common/delivery/goals/Goal";
import {
    ExecuteGoalInvocation,
    ExecuteGoalResult,
    GoalExecutor,
} from "../../../../common/delivery/goals/goalExecution";
import { descriptionFromState, updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { StatusForExecuteGoal } from "../../../../typings/types";
import { repoRefFromStatus } from "../../../../util/git/repoRef";

export async function executeGoal(execute: GoalExecutor,
                                  status: StatusForExecuteGoal.Fragment,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation,
                                  sdmGoal: SdmGoal): Promise<ExecuteGoalResult> {
    logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
    await markGoalInProcess(ctx, sdmGoal, params.goal);
    try {
        const result = await execute(status, ctx, params);
        logger.info("ExecuteGoal: result of %s: %j", params.implementationName, result);
        await markStatus(ctx, sdmGoal, params.goal, result);
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s",
            params.implementationName, repoRefFromStatus(status).url, err.message);
        await markStatus(ctx, sdmGoal, params.goal, {code: 1});
        return failure(err);
    }
}

export function validSubscriptionName(input: string): string {
    return input.replace(/[-\s]/, "_")
        .replace(/^(\d)/, "number$1");
}

export function markStatus(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult) {
    const newState = result.code !== 0 ? "failure" :
        result.requireApproval ? "waiting_for_approval" : "success";
    return updateGoal(ctx, sdmGoal as SdmGoal,
        {
            url: result.targetUrl,
            state: newState,
            description: descriptionFromState(goal, newState),
        });
}

function markGoalInProcess(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal) {
    return updateGoal(ctx, sdmGoal, {
        description: goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name));

}
