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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../api/context/addressChannels";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { Goal } from "../../api/goal/Goal";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { reportFailureInterpretation } from "../misc/reportFailureInterpretation";
/**
 * Report an error executing a goal and present a retry button
 * @return {Promise<void>}
 */
export async function reportGoalError(parameters: {
                                      goal: Goal,
                                      implementationName: string,
                                      addressChannels: AddressChannels,
                                      progressLog: ProgressLog,
                                      id: RemoteRepoRef,
                                      logInterpreter: InterpretLog,
                                  },
                                      err: Error) {
    const {goal, implementationName, addressChannels, progressLog, id, logInterpreter} = parameters;
    logger.error("RunWithLog on goal %s with implementation name '%s' caught error: %s",
        goal.name, implementationName, err.message);
    logger.error(err.stack);
    progressLog.write("ERROR: " + err.message + "\n");

    const interpretation = logInterpreter(progressLog.log);
    // The executor might have information about the failure; report it in the channels
    if (interpretation) {
        if (!interpretation.doNotReportToUser) {
            await reportFailureInterpretation(implementationName, interpretation,
                {url: progressLog.url, log: progressLog.log},
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
