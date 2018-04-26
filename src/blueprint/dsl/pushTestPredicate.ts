
import { PushTest } from "../../common/listener/PushTest";
import { isPushMapping, pushTest } from "../../index";
import { isBoolean } from "util";

/**
 * Predicate that can be used in our PushTest DSL
 */
export type PushTestPredicate = PushTest | boolean | (() => (boolean | Promise<boolean>));

export function toPushTest(p: PushTestPredicate): PushTest {
    return isPushMapping(p) ? p :
        isBoolean(p) ?
            pushTest(p + "", async () => p) :
            pushTest(p + "", async () => p()) ;
}
