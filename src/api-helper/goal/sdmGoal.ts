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

import { sprintf } from "sprintf-js";
import {
    SdmGoalKey,
} from "../../api/goal/SdmGoalMessage";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";

/**
 * @deprecated because I don't think we need this
 */
export function isSdmGoal(a: object): a is SdmGoalEvent {
    const maybe = a as SdmGoalEvent;
    return !!maybe.goalSet && !!maybe.uniqueName && !!maybe.name && !maybe.branch;
}

export function mapKeyToGoal<T extends SdmGoalKey>(goals: T[]): (k: SdmGoalKey) => T {
    return (keyToFind: SdmGoalKey) => {
        const found = goals.find(g => goalKeyEquals(g, keyToFind));
        return found;
    };
}

export function goalKeyEquals(a: SdmGoalKey, b: SdmGoalKey): boolean {
    return a.environment === b.environment &&
        a.name === b.name;
}

export function goalKeyString(gk: SdmGoalKey): string {
    return sprintf("%s in %s", gk.name, gk.environment);
}
