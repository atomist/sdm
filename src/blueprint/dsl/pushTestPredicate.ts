/*
 * Copyright © 2018 Atomist, Inc.
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

import { isBoolean } from "util";
import { PushTest } from "../../common/listener/PushTest";
import { isPushMapping, pushTest } from "../../index";

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
