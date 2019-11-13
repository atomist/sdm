/*
 * Copyright © 2019 Atomist, Inc.
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
    GitProject,
    GitStatus,
    logger,
    NoParameters,
    Project,
} from "@atomist/automation-client";
import {
    CodeTransform,
    TransformResult,
} from "../../../api/registration/CodeTransform";
import { PushAwareParametersInvocation } from "../../../api/registration/PushAwareParametersInvocation";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { LoggingProgressLog } from "../../log/LoggingProgressLog";
import {
    spawnLog,
    SpawnLogInvocation,
    SpawnLogOptions,
    SpawnLogResult,
} from "../../misc/child_process";

/** The bits of SpawnLogResult that spawnToTransform needs. */
type MinSpawnLogResult = Pick<SpawnLogResult, "cmdString" | "code" | "error">;

/**
 * Convert a SpawnLogResult into a TransformResult.
 */
async function spawnToTransform(p: GitProject, r: MinSpawnLogResult): Promise<TransformResult> {
    let edited = false;
    let status: GitStatus;
    try {
        status = await p.gitStatus();
        edited = !status.isClean;
    } catch (e) {
        logger.warn(`Failed to determine GitProject status: ${e.message}`);
    }
    const tr: TransformResult = {
        target: p,
        success: r.code === 0,
        edited,
        error: r.error,
        errorStep: (r.error) ? r.cmdString : undefined,
    };
    return tr;
}

/**
 * Create a code transform by wrapping child processes run in the
 * project directory.  If a command fails, no further commands will be
 * run and its error will be returned.
 *
 * @param commands array of commands to execute
 * @param log where to log output from commands
 * @return result of commands, success or the first failure
 */
export function spawnCodeTransform(commands: SpawnLogInvocation[], log?: ProgressLog): CodeTransform {
    return async (project: Project, papi: PushAwareParametersInvocation<NoParameters>) => {
        const p = project as GitProject;
        const defaultOptions: SpawnLogOptions = {
            cwd: p.baseDir,
            log: log || papi.progressLog || new LoggingProgressLog("spawnCodeTransform"),
        };
        defaultOptions.log.stripAnsi = true;
        let commandResult: MinSpawnLogResult;
        for (const cmd of commands) {
            try {
                commandResult = await spawnLog(cmd.command, cmd.args, { ...defaultOptions, ...cmd.options });
            } catch (e) {
                e.message = `Uncaught error when running command ${cmd.command}: ${e.message}`;
                logger.warn(e.message);
                commandResult = {
                    cmdString: [cmd.command, ...cmd.args].join(" "),
                    code: 99,
                    error: e,
                };
                const errorResult = await spawnToTransform(p, commandResult);
                return errorResult;
            }
            if (commandResult.error) {
                logger.warn(`Error in command ${commandResult.cmdString}: ${commandResult.error.message}`);
                const failResult = await spawnToTransform(p, commandResult);
                return failResult;
            }
        }
        const result = await spawnToTransform(p, commandResult);
        return result;
    };
}
