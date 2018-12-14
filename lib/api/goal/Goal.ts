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
import {
    GoalEnvironment,
    IndependentOfEnvironment,
} from "./support/environment";

/**
 * Core data for a goal
 */
export interface GoalDefinition {

    /**
     * Must be unique among goals
     * Should be camel case
     */
    uniqueName: string;

    /**
     * Optional environment for this goal to run in.
     * This is meant to allow for logical grouping of goals from code, testing and production etc.
     */
    environment?: GoalEnvironment;

    /**
     * Not used any more
     * @deprecated
     */
    orderedName?: string;
    displayName?: string;

    plannedDescription?: string;
    requestedDescription?: string;
    completedDescription?: string;
    workingDescription?: string;
    failedDescription?: string;
    waitingForApprovalDescription?: string;
    waitingForPreApprovalDescription?: string;
    canceledDescription?: string;
    stoppedDescription?: string;
    skippedDescription?: string;

    // when set to true, this goal will execute in its own container/client
    isolated?: boolean;

    // when set to true, this goal requires approval before it is marked success
    approvalRequired?: boolean;

    // when set to true, this goal requires pre approval before it is requested
    preApprovalRequired?: boolean;

    // when set to true, this goal can be retried in case of failure
    retryFeasible?: boolean;
}

/**
 * Represents a delivery action, such as Build or Deploy.
 */
export class Goal {

    public readonly context: GitHubStatusContext;
    public readonly name: string;
    public readonly uniqueName: string;
    public readonly definition: GoalDefinition;

    get environment() {
        return this.definition.environment;
    }

    get successDescription() {
        return this.definition.completedDescription || `Complete: ${this.name}`;
    }

    get inProcessDescription() {
        return this.definition.workingDescription || `Working: ${this.name}`;
    }

    get failureDescription() {
        return this.definition.failedDescription || `Failed: ${this.name}`;
    }

    get plannedDescription() {
        return this.definition.plannedDescription || `Planned: ${this.name}`;
    }

    get requestedDescription() {
        return this.definition.requestedDescription || `Ready: ${this.name}`;
    }

    get waitingForApprovalDescription() {
        return this.definition.waitingForApprovalDescription || `Approval required: ${this.successDescription}`;
    }

    get waitingForPreApprovalDescription() {
        return this.definition.waitingForPreApprovalDescription || `Start required: ${this.name}`;
    }

    get canceledDescription() {
        return this.definition.canceledDescription || `Canceled: ${this.name}`;
    }

    get stoppedDescription() {
        return this.definition.stoppedDescription || `Stopped: ${this.name}`;
    }

    get skippedDescription() {
        return this.definition.skippedDescription || `Skipped: ${this.name}`;
    }

    get retryIntent() {
        return "trigger " + this.name;
    }

    constructor(definition: GoalDefinition) {
        this.definition = validateGoalDefinition(definition);
        // Default environment if hasn't been provided
        if (!this.definition.environment) {
            this.definition.environment = IndependentOfEnvironment;
        }
        this.context = BaseContext + this.definition.environment + this.definition.uniqueName;
        this.name = this.definition.displayName || this.definition.uniqueName;
        this.uniqueName = this.definition.uniqueName;
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

const UniqueNameRegExp = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/i;

function validateGoalDefinition(gd: GoalDefinition): GoalDefinition {
    // First replace all spaces and _ with -
    const uniqueName = gd.uniqueName.replace(/ /g, "-").replace(/_/g, "-").toLowerCase();
    // Now validate the part in front of # against regexp
    if (!UniqueNameRegExp.test(uniqueName.split("#")[0])) {
        throw new Error(`Goal uniqueName '${gd.uniqueName}' must consist of lower case alphanumeric characters or '-', and must start and ` +
            `end with an alphanumeric character (e.g. 'my-name',  or '123-abc', regex used for validation is '${UniqueNameRegExp}')`);
    }

    return {
        ...gd,
        uniqueName,
    };
}
