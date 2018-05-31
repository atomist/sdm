import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { dryRunEditorCommand } from "../../../pack/dry-run/dryRunEditorCommand";
import { editorCommand } from "../../command/editor/editorCommand";
import { generatorCommand } from "../../command/generator/generatorCommand";
import { createCommand } from "../../command/support/createCommand";
import { MachineOrMachineOptions } from "../../machine/support/toMachineOptions";
import { CommandHandlerRegistration } from "../CommandHandlerRegistration";
import { EditorRegistration } from "../EditorRegistration";
import { GeneratorRegistration } from "../GeneratorRegistration";

export function editorRegistrationToCommand(sdm: MachineOrMachineOptions, e: EditorRegistration<any>): Maker<HandleCommand> {
    const fun = e.dryRun ? dryRunEditorCommand : editorCommand;
    return () => fun(
        sdm,
        e.createEditor,
        e.name,
        e.paramsMaker,
        e,
        e.targets,
    );
}

export function generatorRegistrationToCommand(sdm: MachineOrMachineOptions, e: GeneratorRegistration<any>): Maker<HandleCommand> {
    return () => generatorCommand(
        sdm,
        e.createEditor,
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
