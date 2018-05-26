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

import { Goal } from "../../common/delivery/goals/Goal";
import { Goals, isGoals } from "../../common/delivery/goals/Goals";
import { PushListenerInvocation } from "../../common/listener/PushListener";
import { PushTest } from "../../common/listener/PushTest";
import { PredicateMappingTerm, toPredicateMapping } from "../../common/listener/support/PredicateMappingTerm";
import { PushRule } from "../../common/listener/support/PushRule";
import { AnyPush } from "../../common/listener/support/pushtest/commonPushTests";

export class GoalSetterPushRule extends PushRule<Goals> {

    constructor(guard1: PushTest, guards: PushTest[], reason?: string) {
        super(guard1, guards, reason);
    }

    public setGoals(goals: Goals | Goal): this {
        if (!goals) {
            return this.set(goals as Goals);
        }
        return this.set(isGoals(goals) ? goals : new Goals("Solely " + goals.name, goals));
    }

}

/**
 * Simple GoalSetter DSL. Allows use of booleans and functions
 * returning boolean in predicate expressions
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(
    guard1: PredicateMappingTerm<PushListenerInvocation>,
    ...guards: Array<PredicateMappingTerm<PushListenerInvocation>>): GoalSetterPushRule {
    return new GoalSetterPushRule(toPredicateMapping(guard1), guards.map(toPredicateMapping));
}

/**
 * PushRule that matches every push
 * @type {GoalSetterPushRule}
 */
export const onAnyPush = new GoalSetterPushRule(AnyPush, [], "On any push");
