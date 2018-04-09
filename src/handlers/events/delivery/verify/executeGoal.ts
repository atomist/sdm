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
    failure,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import { jwtToken } from "@atomist/automation-client/globals";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as path from "path";
import { Goal } from "../../../../common/delivery/goals/Goal";
import {
    ExecuteGoalInvocation,
    ExecuteGoalResult,
    GoalExecutor,
} from "../../../../common/delivery/goals/goalExecution";
import {
    descriptionFromState,
    updateGoal,
} from "../../../../common/delivery/goals/storeGoals";
import { ConsoleProgressLog } from "../../../../common/log/progressLogs";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { StatusForExecuteGoal } from "../../../../typings/types";
import { repoRefFromStatus } from "../../../../util/git/repoRef";
import { spawnAndWatch } from "../../../../util/misc/spawned";

export async function executeGoal(execute: GoalExecutor,
                                  status: StatusForExecuteGoal.Fragment,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation,
                                  sdmGoal: SdmGoal): Promise<ExecuteGoalResult> {
    logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
    await markGoalInProcess(ctx, sdmGoal, params.goal);
    try {
        // execute pre hook
        let result: any = await executeHook(status, ctx, params, sdmGoal, "pre");

        // TODO CD is there a isSuccess(result) method somewhere
        if (result.code === 0) {

            // execute the actual goal
            let goalResult = await execute(status, ctx, params);
            if (!goalResult) {
                logger.error("execute method for %s of %s returned undefined", params.implementationName, params.goal.name);
                goalResult = Success;
            }

            result = {
                ...result,
                ...goalResult,
            };
        }

        // execute post hook
        if (result.code === 0) {
            let hookResult = await executeHook(status, ctx, params, sdmGoal, "post");
            if (!hookResult) {
                hookResult = Success;
            }
            result = {
                ...result,
                ...hookResult,
            };
        }

        logger.info("ExecuteGoal: result of %s: %j", params.implementationName, result);
        await markStatus(ctx, sdmGoal, params.goal, result);
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s",
            params.implementationName, repoRefFromStatus(status).url, err.message);
        await markStatus(ctx, sdmGoal, params.goal, {code: 1}, err);
        return failure(err);
    }
}

export async function executeHook(status: StatusForExecuteGoal.Fragment,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation,
                                  sdmGoal: SdmGoal,
                                  stage: "post" | "pre"): Promise<HandlerResult> {
    const p = await GitCommandGitProject.cloned({ token: params.githubToken }, repoRefFromStatus(status));
    const hook = goalToHookFile(sdmGoal, stage);
    if (p.fileExistsSync(`.atomist/hooks/${hook}`)) {

        logger.info("Invoking goal %s hook '%s'", stage, hook);

        const opts = {
            cwd: path.join(p.baseDir, ".atomist", "hooks"),
            env: {
                ...process.env,
                // TODO cd do we need more variables to pass over?
                GITHUB_TOKEN: params.githubToken,
                ATOMIST_TEAM: ctx.teamId,
                ATOMIST_CORRELATION_ID: ctx.correlationId,
                ATOMIST_JWT: jwtToken(),
            },
        };

        let result: HandlerResult = await spawnAndWatch(
            { command:  path.join(p.baseDir, ".atomist", "hooks", hook), args: [] },
             opts,
             new ConsoleProgressLog(),
            {
                errorFinder: code => code !== 0,
            });

        if (!result) {
            result = Success;
        }

        logger.info("Goal %s hook returned: %j", stage, result);
        return result;
    }
    return Success;
}

function goalToHookFile(sdmGoal: SdmGoal, prefix: string): string {
    return `${prefix}-${sdmGoal.environment.slice(2)}-${sdmGoal.name}`;
}

export function markStatus(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult, error?: Error) {
    const newState = result.code !== 0 ? "failure" :
        result.requireApproval ? "waiting_for_approval" : "success";
    return updateGoal(ctx, sdmGoal as SdmGoal,
        {
            url: result.targetUrl,
            state: newState,
            description: descriptionFromState(goal, newState),
            error,
        });
}

function markGoalInProcess(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal) {
    return updateGoal(ctx, sdmGoal, {
        description: goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name));

}
