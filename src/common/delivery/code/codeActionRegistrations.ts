import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { PushTest, PushTestInvocation } from "../../listener/GoalSetter";

export interface CodeActionRegistration<A> {

    pushTest?: PushTest;
    action: A;
}

/**
 * Register an editor for autofix. An editor for autofix
 * should not rely on parameters being passed in. An existing editor can be wrapped
 * to use predefined parameters.
 * Any use of MessageClient.respond in an editor used in an autofix will be redirected to
 * linked channels as autofixes are normally invoked in an EventHandler and EventHandlers
 * do not support respond.
 */
export interface AutofixRegistration extends CodeActionRegistration<AnyProjectEditor> {
    name: string;
}

export interface ReviewerRegistration extends CodeActionRegistration<ProjectReviewer> {
    name: string;
}

/**
 * Compute the relevant actions for this push
 * @param {Array<CodeActionRegistration<A>>} registrations
 * @param {PushTestInvocation} pti
 * @return {Promise<A[]>}
 */
export function relevantCodeActions<A extends CodeActionRegistration<any>>(registrations: A[],
                                                                           pti: PushTestInvocation): Promise<A[]> {
    return Promise.all(registrations.filter(t => !t.pushTest || t.pushTest(pti) ? t : undefined));
}
