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

import {
    Goal,
    GoalWithPrecondition,
} from "./Goal";

/**
 * Represents goals set in response to a push
 */
export class Goals {

    public readonly goals: Goal[];

    constructor(public name: string, ...goals: Goal[]) {
        this.goals = goals;
    }
}

export function isGoals(a: any): a is Goals {
    return !!(a as Goals).goals;
}

/**
 *  Builder to build Goals instances.
 */
export interface GoalsBuilder {

    /**
     * Add the given goal or goals to this Goals instance.
     * @param {Goal | Goals} goals
     * @returns {Goals & GoalsAndPreConditionBuilder}
     */
    execute(...goals: Array<Goal | Goals>): Goals & GoalsAndPreConditionBuilder;

}

/**
 * Extension to GoalsBuilder allowing to add preConditions,
 */
export interface GoalsAndPreConditionBuilder extends GoalsBuilder {

    /**
     * Add a preCondition to previously added goal or goals
     * @param {Goal} goals
     * @returns {Goals & GoalsBuilder}
     */
    after(...goals: Array<Goal>): Goals & GoalsBuilder;

}

/**
 * Create Goals instance using a fluent API.
 *
 *  const simpleGoals = goals("Simple Goals")
 *     .execute(ReviewGoal)
 *     .execute(BuildGoal, AutofixGoal).after(ReviewGoal)
 *     .execute(StagingEndpointGoal).after(BuildGoal)
 *     .execute(ProductionDeploymentGoal).after(BuildGoal, StagingEndpointGoal);
 *
 * @param {string} name
 * @returns {Goals & GoalsBuilder}
 */
export function goals(name: string): Goals & GoalsBuilder {
    return new DefaultGoalsBuilder(name);
}

class DefaultGoalsBuilder extends Goals implements GoalsBuilder, GoalsAndPreConditionBuilder {

    private lastGoals: Array<Goal> = [];

    constructor(public name: string) {
        super(name);
    }

    public execute(...newGoals: Array<Goal | Goals>): Goals & GoalsAndPreConditionBuilder {
        const currentGoals = [];

        // Keep track of what goals where last added so that we can add the preConditions later
        newGoals.forEach(g => {
            if (isGoals(g)) {
                currentGoals.push(...g.goals);
            } else {
                currentGoals.push(g);
            }
        });
        this.goals.push(...currentGoals);
        this.lastGoals = currentGoals;

        return this;
    }

    public after(...newGoals: Array<Goal>): Goals & GoalsBuilder {
        const lastGoalsWithPreConditions = [];

        // Add the preCondition into the last added goals
        this.lastGoals.forEach(g => {
            lastGoalsWithPreConditions.push(new GoalWithPrecondition(g.definition, ...newGoals));
        });

        // Remove the previously added goals
        this.lastGoals.forEach(g => {
            const ix = this.goals.indexOf(g);
            if (ix >= 0) {
                this.goals.splice(ix, 1);
            }
        });


        // Add the newly created goals with preConditions
        this.goals.push(...lastGoalsWithPreConditions);
        this.lastGoals = lastGoalsWithPreConditions;

        return this;
    }

}
