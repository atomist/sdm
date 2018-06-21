import { PushReactionRegistration } from "../../api/registration/PushReactionRegistration";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";

/**
 * Compute the relevant actions for this push. Some may be filtered out
 * by their push tests.
 */
export function relevantCodeActions<R>(registrations: Array<PushReactionRegistration<R>>,
                                       pli: PushImpactListenerInvocation): Promise<Array<PushReactionRegistration<R>>> {
    return Promise.all(
        registrations.map(async t => (!t.pushTest || await t.pushTest.mapping(pli)) ? t : undefined))
        .then(elts => elts.filter(x => !!x));
}