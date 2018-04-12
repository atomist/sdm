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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { sprintf } from "sprintf-js";
import { retryCommandNameFor } from "../../../../handlers/commands/triggerGoal";
import { LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { StatusForExecuteGoal } from "../../../../typings/types";
import { reportFailureInterpretationToLinkedChannels } from "../../../../util/slack/reportFailureInterpretationToLinkedChannels";
import { SdmContext } from "../../../context/SdmContext";
import { AddressChannels } from "../../../slack/addressChannels";
import { Goal } from "../Goal";
import { ExecuteGoalResult } from "../goalExecution";

export type ExecuteGoalWithLog = (r: RunWithLogContext) => Promise<ExecuteGoalResult>;

export interface RunWithLogContext extends SdmContext {
    status: StatusForExecuteGoal.Fragment;
    progressLog: ProgressLog;
}

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
                                      logInterpreter: LogInterpreter,
                                  },
                                      err: Error) {
    const {goal, implementationName, addressChannels, progressLog, id, logInterpreter} = parameters;
    logger.error("RunWithLog on goal %s with implementation name '%s' caught error: %s",
        goal.name, implementationName, err.message);
    logger.error(err.stack);
    progressLog.write("ERROR: " + err.message + "\n");
    progressLog.write(err.stack);
    progressLog.write(sprintf("Full error object: [%j]", err));

    const retryButton = buttonForCommand({text: "Retry"},
        retryCommandNameFor(goal), {
            repo: id.repo,
            owner: id.owner,
            sha: id.sha,
            branch: id.branch,
        });

    const interpretation = logInterpreter(progressLog.log);
    // The executor might have information about the failure; report it in the channels
    if (interpretation) {
        if (!interpretation.doNotReportToUser) {
            await reportFailureInterpretationToLinkedChannels(implementationName, interpretation,
                {url: progressLog.url, log: progressLog.log},
                id, addressChannels, retryButton);
        }
    } else {
        // We don't have an interpretation available. Just report
        await addressChannels("Failure executing goal: " + err.message);
    }
}
