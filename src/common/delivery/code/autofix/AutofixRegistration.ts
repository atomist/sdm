
import { AnyProjectEditor, EditResult, toEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { PushTest } from "../../../listener/PushTest";
import { CodeActionRegistration } from "../CodeActionRegistration";

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
 * do not support respond.
 */
export function editorAutofixRegistration(params: {
    name: string,
    editor: AnyProjectEditor,
    pushTest?: PushTest,
    options?: AutofixRegistrationOptions,
}): AutofixRegistration {
    return {
        name: params.name,
        pushTest: params.pushTest,
        options: params.options,
        action: async cri => {
            const ed = toEditor(params.editor);
            return ed(cri.project, cri.context, null);
        },
    };
}
