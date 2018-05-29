import { ProgressLog } from "../../../spi/log/ProgressLog";
import { ChildProcessResult, SpawnCommand, stringifySpawnCommand, watchSpawned } from "../../../util/misc/spawned";
import { logger } from "@atomist/automation-client";
import { LoggingProgressLog } from "../../log/LoggingProgressLog";
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { spawn, SpawnOptions } from "child_process";

/**
 * Create a project editor wrapping spawned local commands
 * run on the project. For example, allows use of tslint as an editor.
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
