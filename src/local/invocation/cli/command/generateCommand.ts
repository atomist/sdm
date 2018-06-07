import { logger } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { Argv } from "yargs";
import { GeneratorTag } from "../../../../api-helper/machine/commandRegistrations";
import { commandHandlersWithTag } from "../../../../pack/info/support/commandSearch";
import { LocalSoftwareDeliveryMachine } from "../../../machine/LocalSoftwareDeliveryMachine";
import { logExceptionsToConsole } from "../support/consoleOutput";

export function addGenerateCommand(sdm: LocalSoftwareDeliveryMachine, yargs: Argv) {
    yargs.command({
        command: "generate <generator>",
        aliases: ["g"],
        builder: {
            owner: {
                required: true,
            },
            repo: {
                required: true,
            },
        },
        describe: "Generate",
        handler: argv => {
            logger.debug("Args are %j", argv);
            const extraArgs = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            return logExceptionsToConsole(() => generateCommand(sdm, argv.generator, argv.owner, argv.repo, extraArgs));
        },
    });
}

async function generateCommand(sdm: LocalSoftwareDeliveryMachine,
                               commandName: string, targetOwner: string, targetRepo: string,
                               extraArgs: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm || !!hm.tags && !hm.tags.some(t => t.name === GeneratorTag)) {
        logger.error(`No generator with name [${commandName}]: Known generators are [${
            commandHandlersWithTag(sdm, GeneratorTag).map(m => m.instance.name)}]`);
        process.exit(1);
    }
    const args = [
        {name: "target.owner", value: targetOwner},
        {name: "target.repo", value: targetRepo},
    ].concat(extraArgs);

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}
