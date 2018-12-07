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
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalKey } from "../../api/goal/SdmGoalMessage";

export function mapKeyToGoal<T extends SdmGoalKey>(goals: T[]): (k: SdmGoalKey) => T {
    return (keyToFind: SdmGoalKey) => {
        const found = goals.find(g => goalKeyEquals(g, keyToFind));
        return found;
    };
}

export function goalKeyEquals(a: SdmGoalKey, b: SdmGoalKey): boolean {
    return a.environment === b.environment &&
        a.uniqueName === b.uniqueName;
}

export function goalKeyString(gk: SdmGoalKey): string {
    return sprintf("%s in %s", gk.uniqueName, gk.environment);
}

/**
 * Retrieve the goal data
 * Note: this purposely only works if the data field is stringified JSON.
 * @param sdmGoal
 */
export function goalData(sdmGoal: SdmGoalEvent): any {
    try {
        return JSON.parse(sdmGoal.data || "");
    } catch (e) {
        throw new Error("Goal data is not stringified JSON");
    }
}

/**
 * Merge the provided data into the goal data
 * @param data
 * @param sdmGoal
 */
export function mergeGoalData(data: any, sdmGoal: SdmGoalEvent): any {
    return {
        ...goalData(sdmGoal),
        ...data,
    };
}
