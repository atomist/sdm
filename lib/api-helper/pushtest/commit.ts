/*
 * Copyright © 2020 Atomist, Inc.
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

import { PushTest } from "../../api/mapping/PushTest";

/**
 * Push test that tests commit messages for a provided regular expression match
 */
export function hasCommit(test: RegExp): PushTest {
    return {
        name: `hasCommit '${test.source}'`,
        mapping: async pi => {
            return pi.push.commits.some(c => test.test(c.message));
        },
    };
}
