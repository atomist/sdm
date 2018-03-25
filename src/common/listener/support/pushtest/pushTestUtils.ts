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
import { LruCache } from "../../../../util/misc/LruCache";
import { ProjectListenerInvocation } from "../../Listener";
import { PushTest, pushTest } from "../../PushTest";

/**
 * Return the opposite of this push test
 * @param {PushTest} t
 * @return {PushTest}
 */
export function not(t: PushTest): PushTest {
    return pushTest(`not (${t.name})`, async pi => !(await t.valueForPush(pi)));
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
                    const result = await pt.valueForPush(pci);
                    logger.debug(`Result of PushTest '${pt.name}' was ${result}`);
                    return result;
                }),
            );
            return !allResults.includes(false);
        });
}

const pushTestResultMemory = new LruCache<boolean>(1000);

/**
 * Cache the PushTest results for this push
 * @param {PushTest} pt
 * @return {PushTest}
 */
export function memoize(pt: PushTest): PushTest {
    return {
        name: pt.name,
        valueForPush: async pti => {
            const key = ptCacheKey(pt, pti);
            let result = pushTestResultMemory.get(key);
            if (result === undefined) {
                result = await pt.valueForPush(pti);
                logger.info(`Evaluated push test [%s] to ${result}: cache stats=%j`, pt.name, pushTestResultMemory.stats);
                pushTestResultMemory.put(key, result);
            }
            return result;
        },
    };
}

function ptCacheKey(pt: PushTest, pti: ProjectListenerInvocation): string {
    return pti.push.id + "_" + pt.name;
}
