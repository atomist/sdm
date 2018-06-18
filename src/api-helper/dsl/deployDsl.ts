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

import { Goal } from "../../api/goal/Goal";
import { PushTest } from "../../api/mapping/PushTest";
import { PushRule } from "../../api/mapping/support/PushRule";
import { StaticPushMapping } from "../../api/mapping/support/StaticPushMapping";
import { DeployerInfo, Target } from "../../spi/deploy/Target";

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
                return outer;
            },
        };

    }
}

export function when(guard1: PushTest, ...guards: PushTest[]): DeployPushRule {
    return new DeployPushRule(guard1, guards);
}
