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

/* tslint:disable:deprecation */

import {
    ChildProcessResult,
    GitProject,
    logger,
    spawnAndWatch,
    SpawnCommand,
    stringifySpawnCommand,
} from "@atomist/automation-client";
import { SpawnOptions } from "child_process";
import { CodeTransform } from "../../../api/registration/CodeTransform";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { LoggingProgressLog } from "../../log/LoggingProgressLog";

/**
 * Create a code transform wrapping spawned local commands
 * run on the project. For example, allows use of tslint as an editorCommand.
 * @param {SpawnCommand[]} commands to execute
 * @param log progress log (optional, stream to console if not passed in)
 * @return {ProjectEditor}
 * @deprecated use spawnCodeTransform
 */
export function localCommandsCodeTransform(commands: SpawnCommand[],
                                           log: ProgressLog = new LoggingProgressLog("commands")): CodeTransform {
    return async (p: GitProject) => {
        const opts: SpawnOptions = {
            cwd: p.baseDir,
        };
        let commandResult: ChildProcessResult;
        for (const cmd of commands) {
            logger.debug("Executing command %s", stringifySpawnCommand(cmd));
            commandResult = await spawnAndWatch(cmd, { ...opts, ...cmd.options },
                log,
                {
                    errorFinder: (code, signal) => code !== 0,
                    stripAnsi: true,
                });
            if (commandResult.error) {
                logger.warn("Error in command %s: %s", stringifySpawnCommand(cmd), commandResult.error);
                break;
            }
        }
        const status = await p.gitStatus();
        return { edited: !status.isClean, target: p, success: !commandResult.error };
    };
}
