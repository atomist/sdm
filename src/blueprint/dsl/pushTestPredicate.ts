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

import { Mapping } from "../../common/listener/Mapping";
import { PushTest } from "../../common/listener/PushTest";
import { isPushMapping, pushTest } from "../../index";
import { PushListenerInvocation } from "../../common/listener/PushListener";

/**
 * Predicate that can be used in our PushTest DSL.
 * Can be a PushTest, a function or computed boolean
 */
export type PushTestPredicate = PushTest | Mapping<PushListenerInvocation, boolean> | boolean | (() => (boolean | Promise<boolean>));

export function toPushTest(p: PushTestPredicate): PushTest {
    if (isPushMapping(p)) {
        return p;
    }
    if (typeof p === "boolean") {
        return pushTest(p + "", async () => p);
    }
    return pushTest(p + "", p as any);
}
