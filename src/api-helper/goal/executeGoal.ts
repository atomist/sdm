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
import { configurationValue } from "@atomist/automation-client/configuration";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as path from "path";
import { sprintf } from "sprintf-js";
import { AddressChannels } from "../../api/context/addressChannels";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { Goal } from "../../api/goal/Goal";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { ReportProgress } from "../../api/goal/progress/ReportProgress";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { GoalExecutionListener, GoalExecutionListenerInvocation } from "../../api/listener/GoalStatusListener";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { SdmGoalState } from "../../typings/types";
import { WriteToAllProgressLog } from "../log/WriteToAllProgressLog";
import { toToken } from "../misc/credentials/toToken";
import { stringifyError } from "../misc/errorPrinting";
import { reportFailureInterpretation } from "../misc/reportFailureInterpretation";
import { spawnAndWatch } from "../misc/spawned";
import {
    descriptionFromState,
    updateGoal,
} from "./storeGoals";
import { possibleAxiosObjectReplacer } from "@atomist/automation-client/internal/transport/AbstractRequestProcessor";

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
 * @param {ExecuteGoal} execute
 * @param {GoalInvocation} goalInvocation
 * @param {SdmGoal} sdmGoal
 * @param {Goal} goal
 * @param {InterpretLog} logInterpreter
 * @param progressReporter
 * @return {Promise<ExecuteGoalResult>}
 */
export async function executeGoal(rules: { projectLoader: ProjectLoader, goalExecutionListeners: GoalExecutionListener[] },
                                  execute: ExecuteGoal,
                                  goalInvocation: GoalInvocation,
                                  sdmGoal: SdmGoalEvent,
                                  goal: Goal,
                                  logInterpreter: InterpretLog,
                                  progressReporter: ReportProgress): Promise<ExecuteGoalResult> {
    if (!!progressReporter) {
        goalInvocation.progressLog = new WriteToAllProgressLog(
            sdmGoal.name,
            goalInvocation.progressLog,
            new ProgressReportingProgressLog(progressReporter, sdmGoal, goalInvocation.context),
        );
    }
    const { addressChannels, progressLog, id, context, credentials } = goalInvocation;
    const implementationName = sdmGoal.fulfillment.name;

    logger.info(`Running ${sdmGoal.name}. Triggered by ${sdmGoal.state} status: ${sdmGoal.externalKey}: ${sdmGoal.description}`);

    async function notifyGoalExecutionListeners(goalEvent: SdmGoalEvent, error?: Error) {
        const inProcessGoalExecutionListenerInvocation: GoalExecutionListenerInvocation = {
            id,
            context,
            addressChannels,
            credentials,
            goalEvent,
            error,
        };
        await Promise.all(rules.goalExecutionListeners.map(gel => gel(inProcessGoalExecutionListenerInvocation)));
    }

    const inProcessGoal = await markGoalInProcess({ ctx: context, sdmGoal, goal, progressLogUrl: progressLog.url });
    await notifyGoalExecutionListeners(inProcessGoal);

    try {
        // execute pre hook
        let result: any = await executeHook(rules, goalInvocation, sdmGoal, "pre");
        if (result.code !== 0) {
            throw new GoalExecutionError({ where: "executing pre-goal hook", result });
        }
        // execute the actual goal
        const goalResult = (await execute(goalInvocation)
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
        const hookResult = (await executeHook(rules, goalInvocation, sdmGoal, "post")) || Success;
        if (hookResult.code !== 0) {
            throw new GoalExecutionError({ where: "executing post-goal hooks", result: hookResult });
        }

        await notifyGoalExecutionListeners({
            ...inProcessGoal,
            state: SdmGoalState.success,
        });

        result = {
            ...result,
            ...goalResult,
            ...hookResult,
        };

        logger.info("ExecuteGoal: result of %s: %j", implementationName, result);
        await markStatus({ context, sdmGoal, goal, result, progressLogUrl: progressLog.url });
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s", implementationName, sdmGoal.sha, err.message);
        logger.warn(err.stack);
        await notifyGoalExecutionListeners({
            ...inProcessGoal,
            state: SdmGoalState.failure,
        }, err);
        await reportGoalError({
            goal, implementationName, addressChannels, progressLog, id, logInterpreter,
        }, err);
        await markStatus({ context, sdmGoal, goal, result: { code: 1 }, error: err, progressLogUrl: progressLog.url });
        return failure(err);
    }
}

export async function executeHook(rules: { projectLoader: ProjectLoader },
                                  goalInvocation: GoalInvocation,
                                  sdmGoal: SdmGoalEvent,
                                  stage: "post" | "pre"): Promise<HandlerResult> {
    const hook = goalToHookFile(sdmGoal, stage);

    // Check configuration to see if hooks should be skipped
    if (!configurationValue<boolean>("sdm.goal.hooks", true)) {
        goalInvocation.progressLog.write("---");
        goalInvocation.progressLog.write(`Invoking goal hook: ${hook}`);
        goalInvocation.progressLog.write(`Result: skipped (hooks disabled in configuration)`);
        goalInvocation.progressLog.write("---");
        await goalInvocation.progressLog.flush();
        return Success;
    }

    const { projectLoader } = rules;
    const { credentials, id, context, progressLog } = goalInvocation;
    return projectLoader.doWithProject({ credentials, id, context, readOnly: true }, async p => {
        progressLog.write("---");
        progressLog.write(`Invoking goal hook: ${hook}`);

        if (p.fileExistsSync(path.join(".atomist", "hooks", hook))) {

            const opts = {
                cwd: path.join(p.baseDir, ".atomist", "hooks"),
                env: {
                    ...process.env,
                    GITHUB_TOKEN: toToken(credentials),
                    ATOMIST_TEAM: context.teamId,
                    ATOMIST_CORRELATION_ID: context.correlationId,
                    ATOMIST_REPO: sdmGoal.push.repo.name,
                    ATOMIST_OWNER: sdmGoal.push.repo.owner,
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

            progressLog.write(`Result: ${JSON.stringify(result, possibleAxiosObjectReplacer, 2)}`);
            progressLog.write("---");
            await progressLog.flush();
            return result;
        } else {
            progressLog.write(`Result: skipped (not provided)`);
            progressLog.write("---");
            await progressLog.flush();
            return Success;
        }
    });
}

function goalToHookFile(sdmGoal: SdmGoalEvent, prefix: string): string {
    return `${prefix}-${sdmGoal.environment.toLocaleLowerCase().slice(2)}-${
        sdmGoal.name.toLocaleLowerCase().replace(" ", "_")}`;
}

export function markStatus(parameters: {
    context: HandlerContext, sdmGoal: SdmGoalEvent, goal: Goal, result: ExecuteGoalResult,
    error?: Error, progressLogUrl: string,
}) {
    const { context, sdmGoal, goal, result, error, progressLogUrl } = parameters;
    const newState = result.code !== 0 ? SdmGoalState.failure :
        result.requireApproval ? SdmGoalState.waiting_for_approval : SdmGoalState.success;

    return updateGoal(context, sdmGoal,
        {
            url: progressLogUrl,
            externalUrl: result.targetUrl,
            state: newState,
            phase: sdmGoal.phase,
            description: descriptionFromState(goal, newState),
            error,
        });
}

async function markGoalInProcess(parameters: {
    ctx: HandlerContext,
    sdmGoal: SdmGoalEvent,
    goal: Goal,
    progressLogUrl: string,
}): Promise<SdmGoalEvent> {
    const { ctx, sdmGoal, goal, progressLogUrl } = parameters;
    sdmGoal.state = SdmGoalState.in_process;
    sdmGoal.description = goal.inProcessDescription;
    sdmGoal.url = progressLogUrl;
    try {
        await updateGoal(ctx, sdmGoal, {
            url: progressLogUrl,
            description: goal.inProcessDescription,
            state: SdmGoalState.in_process,
        });
    } catch (err) {
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name);
    }
    return sdmGoal;
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

export function CompositeGoalExecutor(...goalImplementations: ExecuteGoal[]): ExecuteGoal {
    return async (r: GoalInvocation) => {
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

class ProgressReportingProgressLog implements ProgressLog {

    public log: string;
    public readonly name: string;
    public url: string;

    constructor(private readonly progressReporter: ReportProgress,
                private readonly sdmGoal: SdmGoalEvent,
                private readonly context: HandlerContext) {
        this.name = sdmGoal.name;
    }

    public close(): Promise<any> {
        return Promise.resolve();
    }

    public flush(): Promise<any> {
        return Promise.resolve();
    }

    public isAvailable(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public write(what: string): void {
        const progress = this.progressReporter(what, this.sdmGoal);
        if (progress && progress.phase) {
            if (this.sdmGoal.phase !== progress.phase) {
                this.sdmGoal.phase = progress.phase;
                updateGoal(
                    this.context,
                    this.sdmGoal,
                    {
                        state: this.sdmGoal.state,
                        phase: progress.phase,
                        description: this.sdmGoal.description,
                        url: this.sdmGoal.url,
                    }).then(() => {
                    // Intentionally empty
                })
                    .catch(err => {
                        logger.warn(`Error occurred reporting progress: %s`, err.message);
                    });
            }
        }
    }

}
