/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
