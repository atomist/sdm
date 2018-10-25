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

import { SdmGoalState } from "../../typings/types";

/**
 * Result from goal execution with additional details that will be
 * persisted on the currently executing goal.
 */
export interface GoalDetails {

    /**
     * Optional description to be set on the goal
     */
    description?: string;

    /**
     * Optional state for the goal
     */
    state?: SdmGoalState;

    /**
     * Optional phase to return from the goal execution
     */
    phase?: string;

    /**
     * Optional targetUrl to be set on the goal as externalUrl
     */
    targetUrl?: string;

    /**
     * Optional targetUrls to be set on the goal as externalUrls
     */
    targetUrls?: Array<{ label?: string, url: string}>;

    /**
     * Optional flag to indicate if this goal requires approval now
     * @deprecated use state = SdmGoalState.waiting_for_approval instead
     */
    requireApproval?: boolean;
}

/**
 * Result from goal execution
 */
export interface ExecuteGoalResult extends GoalDetails {

    /**
     * 0 is success; non-zero exit codes will mark the goal as failed,
     * if state is not defined
     */
    code: number;

    /**
     * The simple text message describing the result
     */
    message?: string;
}
