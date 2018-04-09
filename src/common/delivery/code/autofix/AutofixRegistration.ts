
import { AnyProjectEditor, EditResult, toEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { PushTest } from "../../../listener/PushTest";
import { CodeActionRegistration } from "../CodeActionRegistration";
import { logger } from "@atomist/automation-client";

export interface AutofixRegistrationOptions {

    ignoreFailure: boolean;
}

export interface AutofixRegistration extends CodeActionRegistration<EditResult> {

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
