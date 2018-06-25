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

import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { PushReactionRegistration } from "../../api/registration/PushReactionRegistration";

/**
 * Compute the relevant actions for this push. Some may be filtered out
 * by their push tests.
 */
export function relevantCodeActions<R>(registrations: Array<PushReactionRegistration<R>>,
                                       pli: PushImpactListenerInvocation): Promise<Array<PushReactionRegistration<R>>> {
    return Promise.all(
        registrations.map(async t => (!t.pushTest || await t.pushTest.mapping(pli)) ? t : undefined))
        .then(elts => elts.filter(x => !!x));
}
