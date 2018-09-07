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
    BaseContext,
    GitHubStatusContext,
} from "./GitHubContext";
import { GoalEnvironment } from "./support/environment";

/**
 * Core data for a goal
 */
export interface GoalDefinition {

    /**
     * Must be unique among goals
     * Should be camel case
     */
    uniqueName: string;

    environment: GoalEnvironment;

    /**
     * Not used any more
     * @deprecated
     */
    orderedName?: string;
    displayName?: string;

    completedDescription?: string;
    workingDescription?: string;
    failedDescription?: string;
    waitingForApprovalDescription?: string;

    // when set to true, this goal will execute in its own container/client
    isolated?: boolean;

    // when set to true, this goal requires approval before it is marked success
    approvalRequired?: boolean;

    // when set to true, this goal can be retried in case of failure
    retryFeasible?: boolean;
}

/**
 * Represents a delivery action, such as Build or Deploy.
 */
export class Goal {

    public readonly context: GitHubStatusContext;
    public readonly name: string;
    public readonly definition: GoalDefinition;

    get environment() {
        return this.definition.environment;
    }

    get successDescription() {
        return this.definition.completedDescription || ("Complete: " + this.name);
    }

    get inProcessDescription() {
        return this.definition.workingDescription || ("Working: " + this.name);
    }

    get failureDescription() {
        return this.definition.failedDescription || ("Failed: " + this.name);
    }

    get requestedDescription() {
        return "Planned: " + this.name;
    }

    get waitingForApprovalDescription() {
        return this.definition.waitingForApprovalDescription || `Approval required: ${this.successDescription}`;
    }

    get retryIntent() {
        return "trigger " + this.name;
    }

    constructor(definition: GoalDefinition) {
        this.definition = definition;
        this.context = BaseContext + definition.environment + definition.uniqueName;
        this.name = definition.displayName || definition.uniqueName;
    }
}

export class GoalWithPrecondition extends Goal {

    public readonly dependsOn: Goal[];

    constructor(definition: GoalDefinition, ...dependsOn: Goal[]) {
        super(definition);
        this.dependsOn = dependsOn;
    }

}

export function isGoalDefiniton(f: Goal | GoalDefinition): f is GoalDefinition {
    return (f as GoalDefinition).uniqueName && true;
}

export function hasPreconditions(goal: Goal): goal is GoalWithPrecondition {
    return !!(goal as GoalWithPrecondition).dependsOn;
}
