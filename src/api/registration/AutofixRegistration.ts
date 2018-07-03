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
import {
    EditResult,
    toEditor,
} from "@atomist/automation-client/operations/edit/projectEditor";
import { CodeTransform } from "./ProjectOperationRegistration";
import {
    PushReactionRegistration,
    SelectiveCodeActionOptions,
} from "./PushReactionRegistration";
import { PushSelector } from "./PushRegistration";

export interface AutofixRegistrationOptions extends SelectiveCodeActionOptions {

    ignoreFailure: boolean;
}

export interface AutofixRegistration extends PushReactionRegistration<EditResult> {

    options?: AutofixRegistrationOptions;

}

export interface CodeTransformAutofixRegistration extends PushSelector {

    // TODO will be required when editor is removed
    transform?: CodeTransform;

    /**
     * @deprecated use transform
     */
    editor?: CodeTransform;

    options?: AutofixRegistrationOptions;

    parameters?: any;
}

export function isCodeTransformAutofixRegistration(r: AutofixRegisterable): r is CodeTransformAutofixRegistration {
    const maybe = r as CodeTransformAutofixRegistration;
    return !!maybe.transform || !!maybe.editor;
}

export type AutofixRegisterable = AutofixRegistration | CodeTransformAutofixRegistration;

/**
 * @deprecated use CodeTransformAutofixRegistration
 */
export type EditorAutofixRegistration = CodeTransformAutofixRegistration;

/**
 * Create an autofix from an existing CodeTransform. A CodeTransform for autofix
 * should not rely on parameters being passed in. An existing editor can be wrapped
 * to use predefined parameters.
 * Any use of MessageClient.respond in a transform used in an autofix will be redirected to
 * linked channels as autofixes are normally invoked in an EventHandler and EventHandlers
 * do not support respond. Be sure to set parameters if they are required by your transform.
 */
export function toAutofixRegistration(use: CodeTransformAutofixRegistration): AutofixRegistration {
    const transformToUse = toEditor(use.transform || use.editor);
    return {
        name: use.name,
        pushTest: use.pushTest,
        options: use.options,
        action: async cri => {
            logger.debug("About to edit using autofix code transform '%s'", name);
            return transformToUse(cri.project, cri.context, use.parameters);
        },
    };
}
