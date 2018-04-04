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

import { Goal } from "./Goal";

export interface GoalSideEffect {
    sideEffectName: string;
    goalContext: string;
}

export class SdmGoalSideEffectMapper {

    private mappings: GoalSideEffect[] = [];

    public addSideEffect(fulfilledGoal: Goal, sideEffectName: string): this {
        this.mappings.push({ goalContext: fulfilledGoal.context, sideEffectName });
        return this;
    }

    public findByGoal(goal: Goal) {
        const rulesForGoal = this.mappings.filter(m => m.goalContext === goal.context);
        if (rulesForGoal.length === 0) {
            return undefined;
        } else {
            return rulesForGoal[0];
        }
    }
}
