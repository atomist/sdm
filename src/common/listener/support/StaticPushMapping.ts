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
import { PushMapping } from "../PushMapping";
import { PushTest } from "../PushTest";
import { allSatisfied } from "./pushtest/pushTestUtils";

/**
 * PushMapping implementation wholly driven by a PushTest instance.
 * Always returns the same value
 */
export class StaticPushMapping<V> implements PushMapping<V> {

    public readonly guard: PushTest;

    /**
     * Create a PushChoice that will always return the same goals if the guards
     * match
     * @param value value we are guarding
     * @param {PushTest} guard1
     * @param {PushTest} guards
     */
    constructor(public readonly name: string, public readonly value: V, guard1: PushTest, ...guards: PushTest[]) {
        this.guard = allSatisfied(guard1, ...guards);
    }

    public async valueForPush(pi: PushListenerInvocation): Promise<V> {
        return (await this.guard.valueForPush(pi)) ? this.value : undefined;
    }
}
