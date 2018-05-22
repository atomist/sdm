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

import { IsolatedGoalLauncher } from "../../../handlers/events/delivery/goals/launchGoal";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { InterpretLog } from "../../../spi/log/InterpretedLog";
import { RepoContext } from "../../context/SdmContext";
import { PushListenerInvocation } from "../../listener/PushListener";
import { PushTest } from "../../listener/PushTest";
import { Goal } from "./Goal";
import { ExecuteGoalWithLog } from "./support/reportGoalError";

export type GoalFulfillment = GoalImplementation | GoalSideEffect | NoFulfillmentFound;

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoalWithLog;
    pushTest: PushTest;
    logInterpreter: InterpretLog;
}

export type NoFulfillmentFound = string;

export function isGoalImplementation(f: GoalFulfillment): f is GoalImplementation {
    return !!f && !!(f as GoalImplementation).implementationName && true;
}

export function goalFulfillmentToString(gf: GoalFulfillment): string {
    if (isGoalImplementation(gf)) {
        return "Implementation: " + gf.implementationName;
    }
    if (isSideEffect(gf)) {
        return "Side effect expected: " + gf.sideEffectName;
    }
    else return gf;
}

export interface GoalSideEffect {
    sideEffectName: string;
    goal: Goal;
    pushTest: PushTest;
}

export function isSideEffect(f: GoalFulfillment): f is GoalSideEffect {
    return !!f && (f as GoalSideEffect).sideEffectName && true;
}

/**
 * Callback to allow changes to the goal before it gets fullfilled.
 *
 * This is useful to add goal specific information to the data field.
 */
export interface GoalFullfillmentCallback {
    goal: Goal;
    callback: (goal: SdmGoal, context: RepoContext) => Promise<SdmGoal>;
}

export class SdmGoalImplementationMapper {

    private readonly implementations: GoalImplementation[] = [];
    private readonly sideEffects: GoalSideEffect[] = [];
    private readonly callbacks: GoalFullfillmentCallback[] = [];

    constructor(private readonly goalLauncher: IsolatedGoalLauncher) {}

    public findFulfillmentBySdmGoal(goal: SdmGoal): GoalFulfillment {
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

    public addFullfillmentCallback(callback: GoalFullfillmentCallback): this {
        this.callbacks.push(callback);
        return this;
    }

    public async findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined> {
        const implementationsForGoal = this.implementations.filter(m => m.goal.name === goal.name
            && m.goal.environment === goal.environment);
        for (const implementation of implementationsForGoal) {
            if (await implementation.pushTest.mapping(inv)) {
                return implementation;
            }
        }
        const knownSideEffects = this.sideEffects.filter(m => m.goal.name === goal.name
            && m.goal.environment === goal.environment);
        for (const sideEffect of knownSideEffects) {
            if (await sideEffect.pushTest.mapping(inv)) {
                return sideEffect;
            }
        }
        return undefined;
    }

    public findFullfillmentCallbackForGoal(g: SdmGoal): GoalFullfillmentCallback[] {
        return this.callbacks.filter(c =>
            c.goal.name === g.name &&
            // This slice is required because environment is suffixed with /
            (c.goal.definition.environment.slice(0, -1) === g.environment
                || c.goal.definition.environment === g.environment));
    }

    public getIsolatedGoalLauncher(): IsolatedGoalLauncher {
        return this.goalLauncher;
    }
}
