import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { localCommandsEditor } from "../../../../handlers/commands/editors/editorWrappers";
import { SpawnCommand } from "../../../../util/misc/spawned";
import { PushTest } from "../../../listener/GoalSetter";
import { AutofixRegistration } from "../codeActionRegistrations";

/**
 * Register an autofix based on local commands
 */
export class LocalCommandAutofix implements AutofixRegistration {

    public readonly action: ProjectEditor;

    private readonly commands: SpawnCommand[];

    constructor(public name: string,
                public pushTest: PushTest,
                command1: SpawnCommand,
                ...additionalCommands: SpawnCommand[]) {
        this.commands = [command1].concat(additionalCommands);
        this.action = localCommandsEditor(this.commands);
    }

}
