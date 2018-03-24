
import { PushChoice } from "../../common/listener/PushChoice";
import { PushTest } from "../../common/listener/PushTest";
import { GuardedPushChoice } from "../../common/listener/support/GuardedPushChoice";
import { allSatisfied, memoize } from "../../common/listener/support/pushtest/pushTestUtils";

/**
 * Generic DSL for returning an object on a push
 */
export class PushRule<V = any> {

    public value: PushChoice<V>;

    public readonly pushTest: PushTest;

    constructor(protected guard1: PushTest, protected guards: PushTest[], public reason?: string) {
        this.pushTest = allSatisfied(memoize(guard1), ...guards.map(memoize));
    }

    public set(value: V): this {
        this.verify();
        this.value = new GuardedPushChoice<V>(value, this.guard1, ...this.guards);
        return this;
    }

    public verify(): this {
        if (!this.reason) {
            throw new Error("Incomplete PushTest: Required reason");
        }
        return this;
    }

}

export function isPushRule(a: any): a is PushRule {
    const maybePushRule = a as PushRule;
    return !!maybePushRule.pushTest && !!maybePushRule.verify;
}
