import { logger } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { Argv } from "yargs";
import { LocalSoftwareDeliveryMachine } from "../../machine/LocalSoftwareDeliveryMachine";
import { logExceptionsToConsole } from "./logExceptionsToConsole";

export function addEditCommand(sdm: LocalSoftwareDeliveryMachine, yargs: Argv) {
    yargs.command({
        command: "edit",
        aliases: ["e"],
        builder: {
            editor: {
                required: true,
            },
            owner: {
                required: true,
            },
            repos: {
                required: true,
            },
        },
        describe: "Edit",
        handler: argv => {
            logger.debug("Args are %j", argv);
            const extraArgs = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            return logExceptionsToConsole(() => edit(sdm, argv.editor, argv.owner, argv.repos, extraArgs));
        },
    });
}

async function edit(sdm: LocalSoftwareDeliveryMachine,
                    commandName: string, targetOwner: string,
                    targetRepos: string,
                    extraArgs: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm) {
        logger.error(`No editor with name [${commandName}]: Known commands are [${sdm.commandsMetadata.map(m => m.name)}]`);
        process.exit(1);
    }
    const args = [
        {name: "targets.owner", value: targetOwner},
        {name: "target.repos", value: targetRepos},
    ].concat(extraArgs);

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}
