import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { isPushRule, PushRule } from "../../../../blueprint/ruleDsl";
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

    public readonly pushTest: PushTest;

    constructor(public name: string,
                pushSpecifier: PushTest | PushRule,
                command1: SpawnCommand,
                ...additionalCommands: SpawnCommand[]) {
        this.pushTest = isPushRule(pushSpecifier) ? pushSpecifier.pushTest : pushSpecifier;
        this.commands = [command1].concat(additionalCommands);
        this.action = localCommandsEditor(this.commands);
    }

}
