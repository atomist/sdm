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

import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { PushListenerInvocation } from "../listener/PushListener";
import { PushTest } from "./PushTest";

/**
 * Extension to PushTest to pre-condition on SDM goal events, so called GoalTests
 */
export interface GoalTest extends PushTest {

    goalMapping: (goal: SdmGoalEvent) => Promise<boolean>;
    pushMapping: (pli: PushListenerInvocation) => Promise<boolean>;

}

export function goalTest(name: string,
                         goalMapping: (goal: SdmGoalEvent) => Promise<boolean>,
                         pushMapping: (pli: PushListenerInvocation) => Promise<boolean> = async () => true): GoalTest {
    return {
        name,
        // Always return false as this shouldn't be scheduled on pushes
        mapping: async () => false,
        // Safe goal and push mapping for later
        goalMapping,
        pushMapping,
    }
}
