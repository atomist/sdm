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

import { Goals } from "../../goals/Goal";
import { GoalSetter, PushTest, PushTestInvocation } from "../GoalSetter";
import { allSatisfied } from "./pushTestUtils";

/**
 * GoalSetter wholly driven by one or more PushTest instances.
 * Always returns the same goals
 */
export class GuardedGoalSetter implements GoalSetter {

    public guard: PushTest;

    /**
     * Create a GoalSetter that will always return the same goals if the guards
     * match
     * @param {Goals} goals to return if the guards return OK
     * @param {PushTest} guard1
     * @param {PushTest} guards
     */
    constructor(private goals: Goals, guard1: PushTest, ...guards: PushTest[]) {
        this.guard = allSatisfied(guard1, ...guards);
    }

    public async chooseGoals(pi: PushTestInvocation): Promise<Goals | undefined> {
        return this.goals;
    }
}
