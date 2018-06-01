import { HandleCommand, logger, Success } from "@atomist/automation-client";
import { OnCommand } from "@atomist/automation-client/onCommand";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { ProjectOperationRegistration } from "../../api/registration/ProjectOperationRegistration";
import { dryRunEditorCommand } from "../../pack/dry-run/dryRunEditorCommand";
import { createCommand } from "../command/createCommand";
import { editorCommand } from "../command/editor/editorCommand";
import { generatorCommand } from "../command/generator/generatorCommand";
import { MachineOrMachineOptions } from "./toMachineOptions";

import * as stringify from "json-stringify-safe";

export function editorRegistrationToCommand(sdm: MachineOrMachineOptions, e: EditorRegistration<any>): Maker<HandleCommand> {
    const fun = e.dryRun ? dryRunEditorCommand : editorCommand;
    return () => fun(
        sdm,
        toEditorFunction(e),
        e.name,
        e.paramsMaker,
        e,
        e.targets,
    );
}

export function generatorRegistrationToCommand(sdm: MachineOrMachineOptions, e: GeneratorRegistration<any>): Maker<HandleCommand> {
    return () => generatorCommand(
        sdm,
        toEditorFunction(e),
        e.name,
        e.paramsMaker,
        e,
    );
}

export function commandHandlerRegistrationToCommand(sdm: MachineOrMachineOptions, c: CommandHandlerRegistration<any>): Maker<HandleCommand> {
    return () => createCommand(
        sdm,
        toOnCommand(c),
        c.name,
        c.paramsMaker,
        c,
    );
}

function toEditorFunction<PARAMS>(por: ProjectOperationRegistration<PARAMS>): (params: PARAMS) => AnyProjectEditor<PARAMS> {
    if (!!por.editor) {
        return () => por.editor;
    }
    if (!!por.createEditor) {
        return por.createEditor;
    }
    throw new Error(`Registration '${por.name}' is invalid, as it does not specify an editor or createEditor function`);
}

function toOnCommand<PARAMS>(c: CommandHandlerRegistration<PARAMS>): (sdm: MachineOrMachineOptions) => OnCommand<PARAMS> {
    if (!!c.createCommand) {
        return c.createCommand;
    }
    if (!!c.listener) {
        return sdm => async (context, parameters) =>  {
            // const opts = toMachineOptions(sdm);
            // TODO will add this. Currently it doesn't work.
            const credentials = undefined; // opts.credentialsResolver.commandHandlerCredentials(context, undefined);
            // TODO do a look up for associated channels
            const ids: RemoteRepoRef[] = undefined;
            const cli: CommandListenerInvocation = {
                commandName: c.name,
                context,
                parameters,
                addressChannels: (msg, opts) => context.messageClient.respond(msg, opts),
                credentials,
                ids,
            };
            logger.debug("Running command listener %s", stringify(cli));
            try {
                await c.listener(cli);
                return Success;
            } catch (err) {
                logger.error("Error executing command '%s': %s", cli.commandName, err.message);
                return {
                    code: 1,
                    message: err.message,
                };
            }
        };
    }
    throw new Error(`Command '${c.name}' is invalid, as it does not specify a listener or createCommand function`);
}
