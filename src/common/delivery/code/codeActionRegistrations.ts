import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { PushTest, PushTestInvocation } from "../../listener/GoalSetter";

export interface CodeActionRegistration<A> {

    pushTest?: PushTest;
    action: A;
}

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
export function relevantCodeActions<A>(registrations: Array<CodeActionRegistration<A>>, pti: PushTestInvocation): Promise<A[]> {
    return Promise.all(registrations.map(t => !t.pushTest || t.pushTest(pti) ? t.action : undefined))
        .then(elts => elts.filter(elt => !!elt));
}
