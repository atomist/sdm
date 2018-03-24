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

import { Goals } from "../common/delivery/goals/Goals";
import { GoalSetter } from "../common/listener/GoalSetter";
import { PushTest } from "../common/listener/PushTest";
import { AnyPush } from "../common/listener/support/pushtest/commonPushTests";
import { Builder } from "../spi/build/Builder";
import { PushRule } from "./support/PushRule";

export class GoalSetterPushRule extends PushRule<Goals> {

    public builder: Builder;

    public readonly pushTest: PushTest;

    constructor(guard1: PushTest, guards: PushTest[], reason?: string) {
        super(guard1, guards, reason);
    }

    get goalSetter(): GoalSetter {
        return this.value;
    }

    public setGoals(goals: Goals): this {
        return this.set(goals);
    }

    public buildWith(builder: Builder): GoalSetterPushRule {
        this.verify();
        this.builder = builder;
        return this;
    }

    public verify(): this {
        if (!this.reason) {
            throw new Error("Incomplete PushTest: Required reason");
        }
        return this;
    }

}

/**
 * Interim DSL stage
 */
export class PushRuleExplanation {

    constructor(private pushRule: GoalSetterPushRule) {}

    public itMeans(reason: string): GoalSetterPushRule {
        this.pushRule.reason = reason;
        return this.pushRule.verify();
    }
}

/**
 * Simple GoalSetter DSL
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(guard1: PushTest, ...guards: PushTest[]): PushRuleExplanation {
    return new PushRuleExplanation(new GoalSetterPushRule(guard1, guards));
}

export const onAnyPush: GoalSetterPushRule = new GoalSetterPushRule(AnyPush, [], "On any push");
