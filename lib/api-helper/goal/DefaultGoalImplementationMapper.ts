/*
 * Copyright © 2019 Atomist, Inc.
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
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import {
    GoalFulfillment,
    GoalFulfillmentCallback,
    GoalImplementation,
    GoalImplementationMapper,
    GoalSideEffect,
} from "../../api/goal/support/GoalImplementationMapper";
import { PushListenerInvocation } from "../../api/listener/PushListener";

/**
 * Concrete implementation of GoalImplementationMapper
 */
export class DefaultGoalImplementationMapper implements GoalImplementationMapper {

    private readonly implementations: GoalImplementation[] = [];
    private readonly sideEffects: GoalSideEffect[] = [];
    private readonly callbacks: GoalFulfillmentCallback[] = [];
    private readonly goals: Goal[] = [];

    public findImplementationBySdmGoal(goal: SdmGoalEvent): GoalImplementation {
        const matchedNames = this.implementations.filter(m =>
            m.implementationName === goal.fulfillment.name &&
            m.goal.context === goal.externalKey);

        if (matchedNames.length > 1) {
            throw new Error(`Multiple implementations found for name '${goal.fulfillment.name}' on goal '${goal.uniqueName}'`);
        }
        if (matchedNames.length === 0) {
            throw new Error(`No implementation found with name '${goal.fulfillment.name}': ` +
                `Found ${this.implementations.map(impl => impl.implementationName)}`);
        }
        return matchedNames[0];
    }

    public addImplementation(implementation: GoalImplementation): this {
        if (this.implementations.some(i =>
            i.implementationName === implementation.implementationName &&
            i.goal.uniqueName === implementation.goal.uniqueName &&
            i.goal.environment === implementation.goal.environment)) {
            throw new Error(`Implementation with name '${implementation.implementationName
                }' already registered for goal '${implementation.goal.name}'`);
        }
        this.addGoal(implementation.goal);
        this.implementations.push(implementation);
        return this;
    }

    public addSideEffect(sideEffect: GoalSideEffect): this {
        this.addGoal(sideEffect.goal);
        this.sideEffects.push(sideEffect);
        return this;
    }

    public addFulfillmentCallback(callback: GoalFulfillmentCallback): this {
        this.callbacks.push(callback);
        return this;
    }

    public async findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined> {
        const implementationsForGoal = this.implementations.filter(
            m => m.goal.uniqueName === uniqueName(goal) &&
                m.goal.environment === goal.environment);

        const matchingFulfillments: GoalImplementation[] = [];
        for (const implementation of implementationsForGoal) {
            if (await implementation.pushTest.mapping(inv)) {
                matchingFulfillments.push(implementation);
            }
        }

        if (matchingFulfillments.length > 1) {
            throw new Error(`Multiple matching implementations for goal '${goal.uniqueName}' found: '${
                matchingFulfillments.map(f => f.implementationName).join(", ")}'`);
        } else if (matchingFulfillments.length === 1) {
            return matchingFulfillments[0];
        }

        const knownSideEffects = this.sideEffects.filter(
            m => m.goal.uniqueName === uniqueName(goal) &&
                m.goal.environment === goal.environment);
        for (const sideEffect of knownSideEffects) {
            if (await sideEffect.pushTest.mapping(inv)) {
                return sideEffect;
            }
        }
        return undefined;
    }

    public findFulfillmentCallbackForGoal(sdmGoal: SdmGoalEvent): GoalFulfillmentCallback[] {
        return this.callbacks.filter(c =>
            c.goal.uniqueName === uniqueName(sdmGoal) &&
            // This slice is required because environment is suffixed with /
            (c.goal.definition.environment.slice(0, -1) === sdmGoal.environment
                || c.goal.definition.environment === sdmGoal.environment));
    }

    public findGoalBySdmGoal(sdmGoal: SdmGoalEvent): Goal | undefined {
        return this.goals.find(g =>
            g.uniqueName === uniqueName(sdmGoal) &&
            // This slice is required because environment is suffixed with /
            (g.definition.environment.slice(0, -1) === g.environment
                || g.definition.environment === g.environment),
        );
    }

    private addGoal(goal: Goal): void {
        const existingGoal = this.goals.find(g => g.uniqueName === goal.uniqueName);
        if (!existingGoal) {
            this.goals.push(goal);
        } else if (existingGoal !== goal) {
            throw new Error(`Goal with uniqueName '${goal.uniqueName}' already registered`);
        }
    }
}

function uniqueName(goal: Pick<SdmGoalEvent, "uniqueName">): string {
    const un = goal.uniqueName.split("#sdm:");
    return un[0];
}
