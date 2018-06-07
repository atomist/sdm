import { Argv } from "yargs";
import { sdm } from "../../machine";
import { logExceptionsToConsole } from "../support/consoleOutput";

export function addGitHooksCommand(yargs: Argv) {
    yargs.command({
        command: "add-git-hooks",
        describe: "Install git hooks",
        handler: () => {
            return logExceptionsToConsole(() => sdm.installGitHooks());
        },
    });
}
