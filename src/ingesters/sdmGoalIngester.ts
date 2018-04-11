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

import { sprintf } from "sprintf-js";

export const GoalRootType = "SdmGoal";

export type SdmGoalState = "planned" | "requested" | "in_process" | "waiting_for_approval" | "success" | "failure" | "skipped";

export type SdmGoalFulfillmentMethod = "SDM fulfill on requested" | "side-effect" | "other";

export interface SdmGoalFulfillment {
    method: SdmGoalFulfillmentMethod;
    name: string;
}

export interface SdmGoal extends SdmGoalKey {
    uniqueName: string;
    sha: string;
    branch: string;

    repo: {
        name: string;
        owner: string;
        providerId: string;
    };

    fulfillment: SdmGoalFulfillment;

    description: string;
    url?: string;
    goalSet: string;
    state: SdmGoalState;
    ts: number;

    error?: string;
    retryFeasible?: boolean;

    approval?: SdmProvenance;

    provenance: SdmProvenance[];

    preConditions: SdmGoalKey[];

    externalKey?: string;

    data?: string;
}

export interface SdmProvenance {
    correlationId: string;
    registration: string;
    version: string;
    name: string;
    ts: number;

    userId?: string;
    channelId?: string;
}

export interface SdmGoalKey {
    environment: string;
    name: string;
}

export function mapKeyToGoal<T extends SdmGoalKey>(goals: T[]): (SdmGoalKey) => T {
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
