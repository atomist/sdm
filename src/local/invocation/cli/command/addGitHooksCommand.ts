import { Argv } from "yargs";
import { sdm } from "../../machine";
import { logExceptionsToConsole } from "../support/logExceptionsToConsole";

export function addGitHooksCommand(yargs: Argv) {
    yargs.command({
        command: "add-git-hooks",
        describe: "Install web hooks",
        handler: () => {
            return logExceptionsToConsole(() => sdm.installGitHooks());
        },
    });
}
