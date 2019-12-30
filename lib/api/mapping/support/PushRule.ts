/*
 * Copyright © 2019 Atomist, Inc.
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

import { logger } from "@atomist/automation-client/lib/util/logger";
import { PushListenerInvocation } from "../../listener/PushListener";
import { Predicated } from "../PredicateMapping";
import { PushMapping } from "../PushMapping";
import { PushTest } from "../PushTest";
import { allSatisfied } from "./pushTestUtils";
import { StaticPushMapping } from "./StaticPushMapping";

/**
 * Generic DSL support for returning an object on a push
 */
export class PushRule<V = any> implements StaticPushMapping<V>, Predicated<PushListenerInvocation> {

    private staticValue: V;

    get value(): V {
        return this.staticValue;
    }

    public get name(): string {
        return this.reason;
    }

    /**
     * The test for this rule
     */
    public readonly pushTest: PushTest;

    get test(): PushTest {
        return this.pushTest;
    }

    private reason: string;

    constructor(protected guard1: PushTest, protected guards: PushTest[], reason?: string) {
        this.pushTest = allSatisfied(guard1, ...guards);
        this.reason = reason || this.pushTest.name;
    }

    /**
     * Set an additional reason if we want to add information to that which is
     * available from the push tests themselves
     * @param {string} reason
     * @return {this}
     */
    public itMeans(reason: string): this {
        this.reason = reason;
        return this;
    }

    /**
     * Set the value that will be resolved from this rule
     * @param {V} value
     * @return {this}
     */
    public set(value: V): this {
        this.staticValue = value;
        return this;
    }

    public async mapping(p: PushListenerInvocation): Promise<V | undefined> {
        if (await this.pushTest.mapping(p)) {
            logger.debug(`Push test passed: ${this.pushTest.name}`);
            return this.staticValue;
        } else {
            logger.debug(`Push test failed: ${this.pushTest.name}`);
            return undefined;
        }
    }
}

export function isPredicatedStaticValue<T>(pushMapping: PushMapping<T>): pushMapping is StaticPushMapping<T> & Predicated<PushListenerInvocation> {
    const maybe = pushMapping as PushRule;
    return maybe.test && maybe.value;
}
