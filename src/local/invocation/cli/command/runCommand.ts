import { logger } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { Argv } from "yargs";
import { LocalSoftwareDeliveryMachine } from "../../../machine/LocalSoftwareDeliveryMachine";
import { logExceptionsToConsole } from "../support/consoleOutput";

export function addRunCommand(sdm: LocalSoftwareDeliveryMachine, yargs: Argv) {
    yargs.command({
        command: "run <command>",
        aliases: ["r"],
        describe: "Run command",
        handler: argv => {
            logger.debug("Args are %j", argv);
            const command = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            return logExceptionsToConsole(() => runRunCommand(sdm, argv.command, command));
        },
    });
}

async function runRunCommand(sdm: LocalSoftwareDeliveryMachine, commandName: string, args: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm) {
        logger.error(`No command with name [${commandName}]: Known commands are [${sdm.commandsMetadata.map(m => m.name)}]`);
        process.exit(1);
    }

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}
