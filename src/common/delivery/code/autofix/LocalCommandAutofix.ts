import { logger } from "@atomist/automation-client";
import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { spawn, SpawnOptions } from "child_process";
import { ChildProcessResult, SpawnCommand, watchSpawned } from "../../../../util/misc/spawned";
import { PushTest } from "../../../listener/GoalSetter";
import { ConsoleProgressLog } from "../../../log/progressLogs";
import { AutofixRegistration } from "../codeActionRegistrations";

/**
 * Register an autofix based on local commands
 */
export class LocalCommandAutofix implements AutofixRegistration {

    private readonly commands: SpawnCommand[];

    constructor(public name: string,
                public pushTest: PushTest,
                command1: SpawnCommand,
                ...additionalCommands: SpawnCommand[]) {
        this.commands = [command1].concat(additionalCommands);
    }

    get action(): ProjectEditor {
        return async (p: GitProject) => {
            const opts: SpawnOptions = { cwd: p.baseDir};
            let command: ChildProcessResult;
            for (const buildCommand of this.commands) {
                command = await watchSpawned(spawn(buildCommand.command, buildCommand.args, opts), ConsoleProgressLog,
                    {
                        errorFinder: (code, signal) => code !== 0,
                        stripAnsi: true,
                    });
                if (command.error) {
                    logger.warn("Error in autofix: %s", command.error);
                    break;
                }
            }
            const status = await p.gitStatus();
            return { edited: !status.isClean, target: p, success: !command.error};
        };
    }
}
