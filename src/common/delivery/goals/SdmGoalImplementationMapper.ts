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
import { PushListenerInvocation } from "../../listener/PushListener";
import { PushTest } from "../../listener/PushTest";
import { Goal } from "./Goal";
import { ExecuteGoalWithLog } from "./support/reportGoalError";

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

    private readonly implementations: GoalImplementation[] = [];

    private readonly sideEffects: GoalSideEffect[] = [];

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

    public async findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined> {
        const implementationsForGoal = this.implementations.filter(m => m.goal === goal);
        for (const implementation of implementationsForGoal) {
            if (await implementation.pushTest.valueForPush(inv)) {
                return implementation;
            }
        }
        const knownSideEffects = this.sideEffects.filter(m => m.goal === goal);
        for (const sideEffect of knownSideEffects) {
            if (await sideEffect.pushTest.valueForPush(inv)) {
                return sideEffect;
            }
        }
        return undefined;
    }
}
