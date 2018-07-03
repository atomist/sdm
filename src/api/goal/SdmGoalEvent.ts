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

import {
    PushFields,
    SdmGoalState,
} from "../../typings/types";
import {
    SdmGoalKey,
    SdmProvenance,
} from "./SdmGoalMessage";

/**
 * An SdmGoal event.
 *
 * After https://github.com/atomisthq/automation-api/issues/479 is fixed,
 * and we make the required fields NonNull in GraphQL,
 * change this to be a type alias for SdmGoalFields.Fragment.
 */
export interface SdmGoalEvent extends SdmGoalKey {
    uniqueName: string;
    sha: string;
    branch: string;

    push: PushFields.Fragment;

    fulfillment: {
        method: string;
        name: string;
    };

    /*
     * this is also available in the push, but leave it here
     * for backwards compatibility
     */
    repo: {
        owner: string,
        name: string,
        providerId: string,
    }

    /**
     * Current description that goes with the current status
     */
    description?: string;
    url?: string;
    externalUrl?: string;
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
