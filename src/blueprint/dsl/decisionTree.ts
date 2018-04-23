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

import { allSatisfied, PushMapping, PushRules, PushTest } from "../..";

/**
 * Simple DSL to create a decision tree
 * @param givenPushTests PushTests
 * @return interim DSL structure
 */
export function given<V>(...givenPushTests: PushTest[]) {
    const givenPushTest = allSatisfied(...givenPushTests);
    return {
        itMeans(name: string) {
            return {
                set(value: V): PushMapping<V> {
                    return {
                        name,
                        valueForPush: async () => value,
                    };
                },
                then(...pushMappings: Array<PushMapping<V>>): PushMapping<V> {
                    const rules = new PushRules<V>(name, pushMappings);
                    return {
                        name,
                        valueForPush: async pli => {
                            const eligible = await givenPushTest.valueForPush(pli);
                            return eligible ? rules.valueForPush(pli) : undefined;
                        },
                    };
                },
            };
        },
    };
}
