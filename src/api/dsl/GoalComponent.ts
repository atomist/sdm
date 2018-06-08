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

import { Goal } from "../goal/Goal";
import { Goals, isGoals } from "../goal/Goals";

/**
 * Type used in constructing goals
 */
export type GoalComponent = Goal | Goal[] | Goals;

export function toGoals(gc: GoalComponent): Goals {
    return isGoals(gc) ? gc :
        Array.isArray(gc) ? new Goals(gc.map(g => g.name).join("/"), ...gc) :
            new Goals("Solely " + gc.name, gc);
}
