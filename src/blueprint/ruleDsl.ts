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

import {Goals} from "../common/goals/Goal";
import { GoalSetter, PushTest } from "../common/listener/GoalSetter";
import { GuardedGoalSetter } from "../common/listener/support/GuardedGoalSetter";
import { allSatisfied } from "../common/listener/support/pushTestUtils";
import { Builder } from "../spi/build/Builder";

export class PushRule {

    public goalSetter: GoalSetter;

    public builder: Builder;

    public readonly pushTest: PushTest;

    constructor(private guard1: PushTest, private guards: PushTest[]) {
        this.pushTest = allSatisfied(guard1, ...guards);
    }

    public setGoals(goals: Goals): this {
        this.goalSetter = new GuardedGoalSetter(goals, this.guard1, ...this.guards);
        return this;
    }

    public buildWith(builder: Builder): PushRule {
        this.builder = builder;
        return this;
    }

}

/**
 * Simple GoalSetter DSL
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(guard1: PushTest, ...guards: PushTest[]): PushRule {
    return new PushRule(guard1, guards);
}

export const onAnyPush: PushRule = new PushRule(() => true, []);
