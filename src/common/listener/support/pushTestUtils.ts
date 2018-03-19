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

import { logger } from "@atomist/automation-client";
import { PushTest, pushTest } from "../GoalSetter";

/**
 * Return the opposite of this push test
 * @param {PushTest} t
 * @return {PushTest}
 */
export function not(t: PushTest): PushTest {
    return pushTest(`not (${t.name})`, async pi => !(await t.test(pi)));
}

/**
 * Return true if all are satisfied
 * @param {PushTest} pushTests
 * @return {PushTest}
 */
export function allSatisfied(...pushTests: PushTest[]): PushTest {
    return pushTest(pushTests.map(g => g.name).join(" && "),
        async pci => {
            const allResults: boolean[] = await Promise.all(
                pushTests.map(async pt => {
                    const result = await pt.test(pci);
                    logger.debug("Result of PushTest %s was %d", pt.name, result);
                    return result;
                }),
            );
            return !allResults.includes(false);
        });
}
