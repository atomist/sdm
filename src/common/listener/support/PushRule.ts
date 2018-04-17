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

import { PushListenerInvocation } from "../PushListener";
import { PushTest } from "../PushTest";
import { allSatisfied, memoize } from "./pushtest/pushTestUtils";
import { StaticPushMapping } from "./StaticPushMapping";

/**
 * Generic DSL for returning an object on a push
 */
export class PushRule<V = any> implements StaticPushMapping<V> {

    private staticValue: V;

    get value() {
        return this.staticValue;
    }

    public get name(): string {
        return this.reason;
    }

    public readonly pushTest: PushTest;

    constructor(protected guard1: PushTest, protected guards: PushTest[], public reason?: string) {
        this.pushTest = allSatisfied(memoize(guard1), ...guards.map(memoize));
    }

    public set(value: V): this {
        this.verify();
        this.staticValue = value;
        return this;
    }

    public async valueForPush(p: PushListenerInvocation): Promise<V | undefined> {
        if (await this.pushTest.valueForPush(p)) {
            return this.staticValue
        }
    }

    public verify(): this {
        if (!this.reason) {
            throw new Error("Incomplete PushTest: Required reason");
        }
        return this;
    }

}

/**
 * Interim DSL stage
 */
export class PushRuleExplanation<N extends PushRule<any>> {

    constructor(private readonly pushRule: N) {}

    public itMeans(reason: string): N {
        this.pushRule.reason = reason;
        return this.pushRule.verify();
    }
}
