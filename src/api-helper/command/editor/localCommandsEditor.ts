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
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { spawn, SpawnOptions } from "child_process";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { LoggingProgressLog } from "../../log/LoggingProgressLog";
import { ChildProcessResult, SpawnCommand, stringifySpawnCommand, watchSpawned } from "../../misc/spawned";

/**
 * Create a project editorCommand wrapping spawned local commands
 * run on the project. For example, allows use of tslint as an editorCommand.
 * @param {SpawnCommand[]} commands to execute
 * @param log progress log (optional, stream to console if not passed in)
 * @return {ProjectEditor}
 */
export function localCommandsEditor(commands: SpawnCommand[],
                                    log: ProgressLog = new LoggingProgressLog("commands")): ProjectEditor {
    return async (p: GitProject) => {
        const opts: SpawnOptions = {
            cwd: p.baseDir,
        };
        let commandResult: ChildProcessResult;
        for (const cmd of commands) {
            logger.info("Executing command %s", stringifySpawnCommand(cmd));
            commandResult = await watchSpawned(
                spawn(cmd.command, cmd.args, { ...opts, ...cmd.options }),
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
        return {edited: !status.isClean, target: p, success: !commandResult.error};
    };
}
