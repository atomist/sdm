import { HandleCommand, Success } from "@atomist/automation-client";
import { OnCommand } from "@atomist/automation-client/onCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { AddressChannels } from "../../api/context/addressChannels";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { SoftwareDeliveryMachineOptions } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { ProjectOperationRegistration } from "../../api/registration/ProjectOperationRegistration";
import { ConcreteSoftwareDeliveryMachineOptions } from "../../machine/ConcreteSoftwareDeliveryMachineOptions";
import { dryRunEditorCommand } from "../../pack/dry-run/dryRunEditorCommand";
import { createCommand } from "../command/createCommand";
import { editorCommand } from "../command/editor/editorCommand";
import { generatorCommand } from "../command/generator/generatorCommand";
import { MachineOrMachineOptions, toMachineOptions } from "./toMachineOptions";

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
        return (sdm: SoftwareDeliveryMachineOptions) => async (context, parameters) =>  {
            // TODO this type cast and definite dependency is bad
            const opts = toMachineOptions(sdm) as ConcreteSoftwareDeliveryMachineOptions;
            const addressChannels: AddressChannels = null;
            const credentials = opts.credentialsResolver.commandHandlerCredentials(context, undefined);
            const cli: CommandListenerInvocation = {
                commandName: c.name,
                context,
                parameters,
                addressChannels,
                credentials,
            };
            try {
                await c.listener(cli);
                return Success;
            } catch (err) {
                return {
                    code: 1,
                    message: err.message,
                };
            }
        };
    }
    throw new Error(`Command '${c.name}' is invalid, as it does not specify a listener or createCommand function`);
}
