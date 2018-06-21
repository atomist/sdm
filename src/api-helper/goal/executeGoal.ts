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
    failure,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import * as path from "path";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { Goal } from "../../api/goal/Goal";
import { SdmGoal } from "../../api/goal/SdmGoal";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { spawnAndWatch } from "../misc/spawned";
import { descriptionFromState, updateGoal } from "./storeGoals";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { sprintf } from "sprintf-js";
import { AddressChannels } from "../../api/context/addressChannels";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { toToken } from "../misc/credentials/toToken";
import { stringifyError } from "../misc/errorPrinting";
import { reportFailureInterpretation } from "../misc/reportFailureInterpretation";

class GoalExecutionError extends Error {
    public readonly where: string;
    public readonly result?: HandlerResult;
    public readonly cause?: Error;
    constructor(params: { where: string, result?: HandlerResult, cause?: Error }) {
        super("Failure in " + params.where);
        this.where = params.where;
        this.result = params.result;
        this.cause = params.cause;
    }

    get description() {
        const resultDescription = this.result ? `Result code ${this.result.code} ${this.result.message}` : "";
        const causeDescription = this.cause ? `Caused by: ${this.cause.message}` : "";
        return `Failure in ${this.where}: ${resultDescription} ${causeDescription}`;
    }
}

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
    const { addressChannels, progressLog, id } = rwlc;
    const implementationName = sdmGoal.fulfillment.name;
    logger.info(`Running ${sdmGoal.name}. Triggered by ${sdmGoal.state} status: ${sdmGoal.externalKey}: ${sdmGoal.description}`);

    await markGoalInProcess({ ctx, sdmGoal, goal, progressLogUrl: progressLog.url });
    try {
        // execute pre hook
        let result: any = await executeHook(rules, rwlc, sdmGoal, "pre");
        if (result.code !== 0) {
            throw new GoalExecutionError({ where: "executing pre-goal hook", result });
        }
        // execute the actual goal
        const goalResult = (await execute(rwlc)
            .catch(async err => {
                progressLog.write("ERROR caught: " + err.message + "\n");
                progressLog.write(err.stack);
                progressLog.write(sprintf("Full error object: [%s]", stringifyError(err)));
                await progressLog.flush();

                throw new GoalExecutionError({ where: "executing goal", cause: err });
            })) || Success;
        if (goalResult.code !== 0) {
            throw new GoalExecutionError({ where: "executing goal", result: goalResult });
        }

        // execute post hook
        const hookResult = (await executeHook(rules, rwlc, sdmGoal, "post")) || Success;
        if (hookResult.code !== 0) {
            throw new GoalExecutionError({ where: "executing post-goal hooks", result: hookResult });
        }

        result = {
            ...result,
            ...goalResult,
            ...hookResult,
        };

        logger.info("ExecuteGoal: result of %s: %j", implementationName, result);
        await markStatus({ ctx, sdmGoal, goal, result, progressLogUrl: progressLog.url });
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s", implementationName, sdmGoal.sha, err.message);
        logger.warn(err.stack);
        await reportGoalError({
            goal, implementationName, addressChannels, progressLog, id, logInterpreter,
        }, err);
        await markStatus({ ctx, sdmGoal, goal, result: { code: 1 }, error: err, progressLogUrl: progressLog.url });
        return failure(err);
    }
}

export async function executeHook(rules: { projectLoader: ProjectLoader },
                                  rwlc: RunWithLogContext,
                                  sdmGoal: SdmGoal,
                                  stage: "post" | "pre"): Promise<HandlerResult> {
    const { projectLoader } = rules;
    const { credentials, id, context, progressLog } = rwlc;
    return projectLoader.doWithProject({ credentials, id, context, readOnly: true }, async p => {
        const hook = goalToHookFile(sdmGoal, stage);

        progressLog.write("---");
        progressLog.write(`Invoking goal hook: ${hook}`);

        if (p.fileExistsSync(path.join(".atomist", "hooks", hook))) {

            const opts = {
                cwd: path.join(p.baseDir, ".atomist", "hooks"),
                env: {
                    ...process.env,
                    // TODO cd do we need more variables to pass over?
                    // jess: I vote for passing the fewest possible -- like just correlation ID maybe, to show it
                    // can be done.
                    // This is an interface that is easy to expand and very hard to contract.
                    // plus, this is secure information; must we provide it to a script in any repo?
                    GITHUB_TOKEN: toToken(credentials),
                    ATOMIST_TEAM: context.teamId,
                    ATOMIST_CORRELATION_ID: context.correlationId,
                    ATOMIST_REPO: sdmGoal.repo.name,
                    ATOMIST_OWNER: sdmGoal.repo.owner,
                },
            };

            let result: HandlerResult = await spawnAndWatch(
                { command: path.join(p.baseDir, ".atomist", "hooks", hook), args: [] },
                opts,
                progressLog,
                {
                    errorFinder: code => code !== 0,
                });

            if (!result) {
                result = Success;
            }

            progressLog.write(`Result: ${JSON.stringify(result)}`);
            progressLog.write("---");
            return result;
        } else {
            progressLog.write(`Result: skipped (not provided)`);
            progressLog.write("---");
            return Success;
        }
    });
}

function goalToHookFile(sdmGoal: SdmGoal, prefix: string): string {
    return `${prefix}-${sdmGoal.environment.toLocaleLowerCase().slice(2)}-${
        sdmGoal.name.toLocaleLowerCase().replace(" ", "_")}`;
}

export function markStatus(parameters: {
    ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult,
    error?: Error, progressLogUrl: string,
}) {
    const { ctx, sdmGoal, goal, result, error, progressLogUrl } = parameters;
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
    const { ctx, sdmGoal, goal, progressLogUrl } = parameters;
    return updateGoal(ctx, sdmGoal, {
        url: progressLogUrl,
        description: goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name));

}

/**
 * Report an error executing a goal and present a retry button
 * @return {Promise<void>}
 */
async function reportGoalError(parameters: {
    goal: Goal,
    implementationName: string,
    addressChannels: AddressChannels,
    progressLog: ProgressLog,
    id: RemoteRepoRef,
    logInterpreter: InterpretLog,
},
                               err: GoalExecutionError) {
    const { goal, implementationName, addressChannels, progressLog, id, logInterpreter } = parameters;

    logger.error("RunWithLog on goal %s with implementation name '%s' caught error: %s",
        goal.name, implementationName, err.description || err.message);
    if (err.cause) {
        logger.error(err.cause.stack);
        progressLog.write(err.cause.stack);
    } else if (err.result && (err.result as any).error) {
        logger.error((err.result as any).error.stack);
        progressLog.write((err.result as any).error.stack);
    } else {
        logger.error(err.stack);
    }

    progressLog.write("ERROR: " + (err.description || err.message) + "\n");

    const interpretation = logInterpreter(progressLog.log);
    // The executor might have information about the failure; report it in the channels
    if (interpretation) {
        if (!interpretation.doNotReportToUser) {
            await reportFailureInterpretation(implementationName, interpretation,
                { url: progressLog.url, log: progressLog.log },
                id, addressChannels);
        }
    } else {
        // We don't have an interpretation available. Just report
        await addressChannels("Failure executing goal: " + err.message);
    }
}

export function CompositeGoalExecutor(...goalImplementations: ExecuteGoalWithLog[]): ExecuteGoalWithLog {
    return async (r: RunWithLogContext) => {
        let overallResult: ExecuteGoalResult = {
            code: 0,
        };

        for (const goalImplementation of goalImplementations) {
            const result = await goalImplementation(r);
            if (result.code !== 0) {
                return result;
            } else {
                overallResult = {
                    code: result.code,
                    requireApproval: result.requireApproval ? result.requireApproval : overallResult.requireApproval,
                    message: result.message ? `${overallResult.message}\n${result.message}` : overallResult.message,
                };
            }
        }
        return overallResult;
    };
}
