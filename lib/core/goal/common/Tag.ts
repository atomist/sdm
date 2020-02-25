/*
 * Copyright © 2020 Atomist, Inc.
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

import { Goal } from "../../../api/goal/Goal";
import { ExecuteGoal } from "../../../api/goal/GoalInvocation";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
} from "../../../api/goal/GoalWithFulfillment";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { executeTag } from "../../delivery/build/executeTag";

/**
 * Properties to customize [[Tag]] goal.
 */
export interface TagRegistration {
    /** Set fulfillment goal executor. */
    goalExecutor?: ExecuteGoal;
    /** Name for fulfillment. */
    name?: string;
}

/**
 * Goal that performs project tagging using Git.  If no fulfillment is
 * added to the goal, one is added during registration that tags using
 * the goal set pre-release version as created by the [[Version]]
 * goal.
 */
export class Tag extends FulfillableGoal {

    constructor(goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("tag"), ...dependsOn: Goal[]) {
        super({
            workingDescription: "Tagging",
            completedDescription: "Tagged",
            failedDescription: "Failed to create Tag",
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("tag")),
            displayName: "tag",
        }, ...dependsOn);
    }

    /**
     * Called by the SDM on initialization.  This function calls
     * `super.register` and adds a startup listener to the SDM.
     *
     * The startup listener registers a default goal fulfillment that
     * calles [[executeTag]] with no arguments.
     */
    public register(sdm: SoftwareDeliveryMachine): void {
        super.register(sdm);

        sdm.addStartupListener(async () => {
            if (this.fulfillments.length === 0 && this.callbacks.length === 0) {
                this.with();
            }
        });
    }

    /**
     * Add fulfillment to this goal.
     */
    public with(registration: TagRegistration = {}): this {
        const name = registration.name || DefaultGoalNameGenerator.generateName((registration.goalExecutor) ? "custom-tag" : "prerelease-tag");
        const goalExecutor = registration.goalExecutor || executeTag();
        super.addFulfillment({ name, goalExecutor });
        return this;
    }

}
