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

import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { LogInterpreter } from "../../../spi/log/InterpretedLog";
import { ProjectListenerInvocation } from "../../listener/Listener";
import { PushTest } from "../../listener/PushTest";
import { ExecuteGoalWithLog } from "../deploy/runWithLog";
import { Goal } from "./Goal";

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoalWithLog;
    pushTest: PushTest;
    logInterpreter: LogInterpreter;
}

export class SdmGoalImplementationMapper {

    private mappings: GoalImplementation[] = [];

    public findBySdmGoal(goal: SdmGoal): GoalImplementation {
        const matchedNames = this.mappings.filter(m => m.implementationName === goal.fulfillment.name);
        if (matchedNames.length > 1) {
            throw new Error("Multiple mappings for name " + goal.fulfillment.name);
        }
        if (matchedNames.length === 0) {
            throw new Error("No implementation found with name " + goal.fulfillment.name);
        }
        return matchedNames[0];
    }

    public addImplementation(implementation: GoalImplementation): this {
        this.mappings.push(implementation);
        return this;
    }

    public findByPush(goal: Goal, inv: ProjectListenerInvocation) {
        const rulesForGoal = this.mappings.filter(m => m.goal === goal)
            .filter(m => m.pushTest.valueForPush(inv));
        if (rulesForGoal.length === 0) {
            return undefined;
        } else {
            return rulesForGoal[0];
        }
    }
}
