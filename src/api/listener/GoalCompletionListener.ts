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

import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { RepoListenerInvocation, SdmListener } from "./Listener";

/**
 * Invocation on goal that has succeeded or failed.
 * This could come from any SDM. GoalExecutionListener focuses only on goals
 * from the present SDM.
 */
export interface GoalCompletionListenerInvocation extends RepoListenerInvocation {
    completedGoal: SdmGoalEvent;
    allGoals: SdmGoalEvent[];
}

export type GoalCompletionListener = SdmListener<GoalCompletionListenerInvocation>;
