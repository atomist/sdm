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

export type GoalFulfillment = GoalImplementation | GoalSideEffect;

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoalWithLog;
    pushTest: PushTest;
    logInterpreter: LogInterpreter;
}
export function isGoalImplementation(f: GoalFulfillment): f is GoalImplementation {
    return !!f && !!(f as GoalImplementation).implementationName && true;
}

export interface GoalSideEffect {
    sideEffectName: string;
    goal: Goal;
    pushTest: PushTest;
}
export function isSideEffect(f: GoalFulfillment): f is GoalSideEffect {
    return !!f && (f as GoalSideEffect).sideEffectName && true;
}


export class SdmGoalImplementationMapper {

    private implementations: GoalImplementation[] = [];

    private sideEffects: GoalSideEffect[] = [];

    public findImplementationBySdmGoal(goal: SdmGoal): GoalImplementation {
        const matchedNames = this.implementations.filter(m =>
            m.implementationName === goal.fulfillment.name &&
            m.goal.context === goal.externalKey);
        if (matchedNames.length > 1) {
            throw new Error("Multiple mappings for name " + goal.fulfillment.name);
        }
        if (matchedNames.length === 0) {
            throw new Error("No implementation found with name " + goal.fulfillment.name);
        }
        return matchedNames[0];
    }

    public addImplementation(implementation: GoalImplementation): this {
        this.implementations.push(implementation);
        return this;
    }

    public addSideEffect(sideEffect: GoalSideEffect): this {
        this.sideEffects.push(sideEffect);
        return this;
    }

    public findSideEffectByGoal(goal: Goal) {
        const rulesForGoal = this.sideEffects
            .filter(m => m.goal.context === goal.context);
        if (rulesForGoal.length === 0) {
            return undefined;
        } else {
            return rulesForGoal[0];
        }
    }

    public findFulfillmentByPush(goal: Goal, inv: ProjectListenerInvocation):
        GoalFulfillment | undefined {
        const implementationsForGoal = this.implementations.filter(m => m.goal === goal)
            .filter(m => m.pushTest.valueForPush(inv));
        if (implementationsForGoal.length > 0) {
            return implementationsForGoal[0];
        }
        const knownSideEffects = this.sideEffects.filter(m => m.goal === goal)
            .filter(m => m.pushTest.valueForPush(inv));
        if (knownSideEffects.length > 0) {
            return knownSideEffects[0];
        }
        return undefined;
    }
}
