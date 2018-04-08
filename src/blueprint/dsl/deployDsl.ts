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

import { DeployerInfo, Target } from "../../common/delivery/deploy/deploy";
import { Goal } from "../../common/delivery/goals/Goal";
import { PushTest } from "../../common/listener/PushTest";
import { PushRule, PushRuleExplanation } from "../../common/listener/support/PushRule";
import { StaticPushMapping } from "../../common/listener/support/StaticPushMapping";

export class DeployPushRule extends PushRule<Target> {

    constructor(guard1: PushTest, guards: PushTest[], reason?: string) {
        super(guard1, guards, reason);
    }

    public deployTo(deployGoal: Goal, endpointGoal: Goal, undeployGoal: Goal) {
        const outer = this;
        return {
            using(t: DeployerInfo<any>): StaticPushMapping<Target<any>> {
                outer.set({
                    ...t,
                    deployGoal,
                    endpointGoal,
                    undeployGoal,
                });
                return outer.choice;
            },
        };

    }
}

export function when(guard1: PushTest, ...guards: PushTest[]): PushRuleExplanation<DeployPushRule> {
    return new PushRuleExplanation(new DeployPushRule(guard1, guards));
}
