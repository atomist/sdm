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
 * Read and parse goal event data.  If the goal event has no data,
 * return an empty object.  Note: this purposely only works if the
 * data field is stringified JSON.
 *
 * @param sdmGoal
 * @return JSON parsed goal event data property
 */
export function goalData(sdmGoal: SdmGoalEvent): any {
    if (!sdmGoal?.data) {
        return {};
    }
    let data: any;
    try {
        data = JSON.parse(sdmGoal.data);
    } catch (e) {
        e.message = `Failed to parse goal event data for ${sdmGoal.uniqueName} as JSON '${sdmGoal.data}': ${e.message}`;
        throw e;
    }
    return data;
}

/**
 * Return a shallow merge the provided `data` and the goal event data
 * property, parsed as JSON.  Properties in `data` take precedence
 * over those in the parsed goal event data object.
 *
 * @param data
 * @param sdmGoal
 * @return shallow merge of data and SDM goal event data property
 */
export function mergeGoalData(data: any, sdmGoal: SdmGoalEvent): any {
    return {
        ...goalData(sdmGoal),
        ...data,
    };
}
