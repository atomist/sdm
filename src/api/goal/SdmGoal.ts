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

export const GoalRootType = "SdmGoal";

export type SdmGoalState = "planned" | "requested" | "in_process" | "waiting_for_approval" | "success" | "failure" | "skipped";

export type SdmGoalFulfillmentMethod = "SDM fulfill on requested" | "side-effect" | "other";

export interface SdmGoalFulfillment {
    method: SdmGoalFulfillmentMethod;
    name: string;
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

/**
 * Data persisted in the Atomist Cortex
 */
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

    /**
     * Current description that goes with the current status
     */
    description: string;
    url?: string;
    goalSet: string;
    goalSetId: string;
    state: SdmGoalState;

    /**
     * Timestamp
     */
    ts: number;

    error?: string;
    retryFeasible?: boolean;

    approval?: SdmProvenance;
    approvalRequired?: boolean;

    provenance: SdmProvenance[];

    preConditions: SdmGoalKey[];

    externalKey?: string;

    data?: string;
}
