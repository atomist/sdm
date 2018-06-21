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

import { SdmGoal } from "../../api/goal/SdmGoal";
import { Goals } from "../goal/Goals";
import { RepoListenerInvocation, SdmListener } from "./Listener";

/**
 * Invokes when goals have been set
 */
export interface GoalsSetListenerInvocation extends RepoListenerInvocation {

    /**
     * The goals that were set
     */
    goalSet: Goals | null;

    goalSetId: string;
}

export type GoalsSetListener = SdmListener<GoalsSetListenerInvocation>;

export interface GoalCompletionListenerInvocation extends RepoListenerInvocation {
    completedGoal: SdmGoal;
    allGoals: SdmGoal[];
}

export type GoalCompletionListener = SdmListener<GoalCompletionListenerInvocation>;
