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

import { failure, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { jwtToken } from "@atomist/automation-client/globals";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import * as path from "path";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { ExecuteGoalResult } from "../../../../common/delivery/goals/goalExecution";
import { descriptionFromState, updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { ExecuteGoalWithLog, reportGoalError, RunWithLogContext } from "../../../../common/delivery/goals/support/reportGoalError";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { spawnAndWatch } from "../../../../util/misc/spawned";

/**
 * Central function to execute a goal with progress logging
 * @param {{projectLoader: ProjectLoader}} rules
 * @param {ExecuteGoalWithLog} execute
 * @param {RunWithLogContext} rwlc
 * @param {SdmGoal} sdmGoal
 * @param {Goal} goal
 * @param {LogInterpreter} logInterpreter
 * @return {Promise<ExecuteGoalResult>}
 */
export async function executeGoal(rules: { projectLoader: ProjectLoader },
                                  execute: ExecuteGoalWithLog,
                                  rwlc: RunWithLogContext,
                                  sdmGoal: SdmGoal,
                                  goal: Goal,
                                  logInterpreter: LogInterpreter): Promise<ExecuteGoalResult> {
    const ctx = rwlc.context;
    const {addressChannels, progressLog, id} = rwlc;
    const implementationName = sdmGoal.fulfillment.name;
    logger.info(`Running ${sdmGoal.name}. Triggered by ${sdmGoal.state} status: ${sdmGoal.externalKey}: ${sdmGoal.description}`);

    await markGoalInProcess(ctx, sdmGoal, goal);
    try {
        // execute pre hook
        let result: any = await executeHook(rules, rwlc, sdmGoal, "pre");

        // TODO CD is there a isSuccess(result) method somewhere
        if (result.code === 0) {
            // execute the actual goal
            let goalResult = await execute(rwlc)
                .catch(err =>
                    reportGoalError({
                        goal, implementationName, addressChannels, progressLog, id, logInterpreter,
                    }, err)
                        .then(() => Promise.reject(err)),
                );
            if (!goalResult) {
                logger.error("Execute method for %s of %s returned undefined", implementationName, sdmGoal.name);
                goalResult = Success;
            }

            if (goalResult.code !== 0) {
                await reportGoalError({goal, implementationName, addressChannels, progressLog, id, logInterpreter},
                    new Error("Failure reported: " + goalResult.message));
            }

            result = {
                ...result,
                ...goalResult,
            };
        }

        // execute post hook
        if (result.code === 0) {
            let hookResult = await executeHook(rules, rwlc, sdmGoal, "post");
            if (!hookResult) {
                hookResult = Success;
            }
            result = {
                ...result,
                ...hookResult,
            };
        }

        logger.info("ExecuteGoal: result of %s: %j", implementationName, result);
        await markStatus(ctx, sdmGoal, goal, result);
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s",
            implementationName, sdmGoal.sha, err.message);
        logger.warn(err.stack);
        await markStatus(ctx, sdmGoal, goal, {code: 1}, err);
        return failure(err);
    }
}

export async function executeHook(rules: { projectLoader: ProjectLoader },
                                  rwlc: RunWithLogContext,
                                  sdmGoal: SdmGoal,
                                  stage: "post" | "pre"): Promise<HandlerResult> {
    const {projectLoader} = rules;
    const {credentials, id, context, progressLog} = rwlc;
    return projectLoader.doWithProject({credentials, id, context, readOnly: true}, async p => {
        const hook = goalToHookFile(sdmGoal, stage);
        if (p.fileExistsSync(`.atomist/hooks/${hook}`)) {

            logger.info("Invoking goal %s hook '%s'", stage, hook);

            const opts = {
                cwd: path.join(p.baseDir, ".atomist", "hooks"),
                env: {
                    ...process.env,
                    // TODO cd do we need more variables to pass over?
                    // jess: I vote for passing the fewest possible -- like just correlation ID maybe, to show it
                    // can be done.
                    // This is an interface that is easy to expand and very hard to contract.
                    // plus, this is secure information; must we provide it to a script in any repo?
                    GITHUB_TOKEN: (credentials as TokenCredentials).token,
                    ATOMIST_TEAM: context.teamId,
                    ATOMIST_CORRELATION_ID: context.correlationId,
                    ATOMIST_JWT: jwtToken(),
                },
            };

            let result: HandlerResult = await spawnAndWatch(
                {command: path.join(p.baseDir, ".atomist", "hooks", hook), args: []},
                opts,
                progressLog,
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
    });
}

function goalToHookFile(sdmGoal: SdmGoal, prefix: string): string {
    return `${prefix}-${sdmGoal.environment.slice(2)}-${sdmGoal.name}`;
}

export function markStatus(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult, error?: Error) {
    const newState = result.code !== 0 ? "failure" :
        result.requireApproval ? "waiting_for_approval" : "success";
    return updateGoal(ctx, sdmGoal,
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
