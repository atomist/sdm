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

import { ExecuteGoalResult } from "../goal/ExecuteGoalResult";
import { Goal } from "../goal/Goal";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import {
    RepoListenerInvocation,
    SdmListener,
} from "./Listener";

/**
 * Invokes when an event occurs relating to execution of a goal
 * within this SDM.
 */
export interface GoalExecutionListenerInvocation extends RepoListenerInvocation {

    /**
     * The goal that is current executing
     */
    goal: Goal;

    /**
     * The goal event that changed state
     */
    goalEvent: SdmGoalEvent;

    /**
     * Error that was raised during goal execution if not handled inside the
     * goalExecutor
     */
    error?: Error;

    /**
     * Result of goal execution; only available if goalExecutor returned an result
     */
    result?: ExecuteGoalResult | undefined;

}

export type GoalExecutionListener = SdmListener<GoalExecutionListenerInvocation>;
