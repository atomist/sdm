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

import { failure, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { jwtToken } from "@atomist/automation-client/globals";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import * as path from "path";
import { ExecuteGoalResult } from "../../../../common/delivery/goals/ExecuteGoalResult";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { descriptionFromState, updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { ExecuteGoalWithLog, reportGoalError, RunWithLogContext } from "../../../../common/delivery/goals/support/reportGoalError";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { InterpretLog } from "../../../../spi/log/InterpretedLog";
import { spawnAndWatch } from "../../../../util/misc/spawned";

import { sprintf } from "sprintf-js";

import * as stringify from "json-stringify-safe";

/**
 * Central function to execute a goal with progress logging
 * @param {{projectLoader: ProjectLoader}} rules
 * @param {ExecuteGoalWithLog} execute
 * @param {RunWithLogContext} rwlc
 * @param {SdmGoal} sdmGoal
 * @param {Goal} goal
 * @param {InterpretLog} logInterpreter
 * @return {Promise<ExecuteGoalResult>}
 */
export async function executeGoal(rules: { projectLoader: ProjectLoader },
                                  execute: ExecuteGoalWithLog,
                                  rwlc: RunWithLogContext,
                                  sdmGoal: SdmGoal,
                                  goal: Goal,
                                  logInterpreter: InterpretLog): Promise<ExecuteGoalResult> {
    const ctx = rwlc.context;
    const {addressChannels, progressLog, id} = rwlc;
    const implementationName = sdmGoal.fulfillment.name;
    logger.info(`Running ${sdmGoal.name}. Triggered by ${sdmGoal.state} status: ${sdmGoal.externalKey}: ${sdmGoal.description}`);

    await markGoalInProcess({ctx, sdmGoal, goal, progressLogUrl: progressLog.url});
    try {
        // execute pre hook
        let result: any = await executeHook(rules, rwlc, sdmGoal, "pre");

        // TODO CD is there a isSuccess(result) method somewhere
        if (result.code === 0) {
            // execute the actual goal
            let goalResult = await execute(rwlc)
                .catch(err => {
                        progressLog.write("ERROR caught: " + err.message + "\n");
                        progressLog.write(err.stack);
                        progressLog.write(sprintf("Full error object: [%s]", stringify(err)));

                        return reportGoalError({
                            goal, implementationName, addressChannels, progressLog, id, logInterpreter,
                        }, err)
                            .then(() => Promise.reject(err));
                    },
                );
            if (!goalResult) {
                logger.error("Execute method for %s of %s returned undefined", implementationName, sdmGoal.name);
                goalResult = Success;
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
        } else {
            await reportGoalError({goal, implementationName, addressChannels, progressLog, id, logInterpreter},
                new Error("Failure reported: " + result.message));
        }

        logger.info("ExecuteGoal: result of %s: %j", implementationName, result);
        await markStatus({ctx, sdmGoal, goal, result, progressLogUrl: progressLog.url});
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s",
            implementationName, sdmGoal.sha, err.message);
        logger.warn(err.stack);
        await markStatus({ctx, sdmGoal, goal, result: {code: 1}, error: err, progressLogUrl: progressLog.url});
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

export function markStatus(parameters: {
    ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult,
    error?: Error, progressLogUrl: string,
}) {
    const {ctx, sdmGoal, goal, result, error, progressLogUrl} = parameters;
    const newState = result.code !== 0 ? "failure" :
        result.requireApproval ? "waiting_for_approval" : "success";
    // Currently, the goals tend to have a single url so it seems safe to use whichever of these we have.
    // Going forward it may make sense to have both a logging and a result URL.
    const url = result.targetUrl || progressLogUrl;
    return updateGoal(ctx, sdmGoal,
        {
            url,
            state: newState,
            description: descriptionFromState(goal, newState),
            error,
        });
}

function markGoalInProcess(parameters: { ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, progressLogUrl: string }) {
    const {ctx, sdmGoal, goal, progressLogUrl} = parameters;
    return updateGoal(ctx, sdmGoal, {
        url: progressLogUrl,
        description: goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name));

}
