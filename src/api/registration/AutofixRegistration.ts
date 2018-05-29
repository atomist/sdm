/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { AnyProjectEditor, EditResult, toEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { PushTest } from "../mapping/PushTest";
import { PushReactionRegistration, SelectiveCodeActionOptions } from "./PushReactionRegistration";

export interface AutofixRegistrationOptions extends SelectiveCodeActionOptions {

    ignoreFailure: boolean;
}

export interface AutofixRegistration extends PushReactionRegistration<EditResult> {

    options?: AutofixRegistrationOptions;

}

/**
 * Create an autofix from an existing editor. An editor for autofix
 * should not rely on parameters being passed in. An existing editor can be wrapped
 * to use predefined parameters.
 * Any use of MessageClient.respond in an editor used in an autofix will be redirected to
 * linked channels as autofixes are normally invoked in an EventHandler and EventHandlers
 * do not support respond. Be sure to set parameters if they are required by your editor.
 */
export function editorAutofixRegistration(use: {
    name: string,
    editor: AnyProjectEditor,
    pushTest?: PushTest,
    options?: AutofixRegistrationOptions,
    parameters?: any,
}): AutofixRegistration {
    const editorToUse = toEditor(use.editor);
    return {
        name: use.name,
        pushTest: use.pushTest,
        options: use.options,
        action: async cri => {
            logger.debug("About to edit using autofix editor %s", use.editor.toString());
            return editorToUse(cri.project, cri.context, use.parameters);
        },
    };
}
