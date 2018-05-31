import { HandleCommand } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { dryRunEditorCommand } from "../../../pack/dry-run/dryRunEditorCommand";
import { editorCommand } from "../../command/editor/editorCommand";
import { generatorCommand } from "../../command/generator/generatorCommand";
import { createCommand } from "../../command/support/createCommand";
import { MachineOrMachineOptions } from "../../machine/support/toMachineOptions";
import { CommandHandlerRegistration } from "../CommandHandlerRegistration";
import { EditorRegistration } from "../EditorRegistration";
import { GeneratorRegistration } from "../GeneratorRegistration";
import { ProjectOperationRegistration } from "../ProjectOperationRegistration";

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

export function commandHandlerRegistrationToCommand(sdm: MachineOrMachineOptions, e: CommandHandlerRegistration<any>): Maker<HandleCommand> {
    return () => createCommand(
        sdm,
        e.createCommand,
        e.name,
        e.paramsMaker,
        e,
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
