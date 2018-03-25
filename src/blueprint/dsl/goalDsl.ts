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

import { Goals } from "../../common/delivery/goals/Goals";
import { PushTest } from "../../common/listener/PushTest";
import { AnyPush } from "../../common/listener/support/pushtest/commonPushTests";
import { PushRule, PushRuleExplanation } from "../../common/listener/support/PushRule";

export class GoalSetterPushRule extends PushRule<Goals> {

    constructor(guard1: PushTest, guards: PushTest[], reason?: string) {
        super(guard1, guards, reason);
    }

    public setGoals(goals: Goals): this {
        return this.set(goals);
    }

}

/**
 * Simple GoalSetter DSL
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(guard1: PushTest, ...guards: PushTest[]): PushRuleExplanation<GoalSetterPushRule> {
    return new PushRuleExplanation(new GoalSetterPushRule(guard1, guards));
}

export const onAnyPush = new GoalSetterPushRule(AnyPush, [], "On any push");
