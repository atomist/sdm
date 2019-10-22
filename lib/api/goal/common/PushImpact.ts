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

import { executePushImpact } from "../../../api-helper/listener/executePushImpact";
import {
    PushImpactListener,
    PushImpactListenerRegistration,
} from "../../registration/PushImpactListenerRegistration";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Goal that invokes PushImpactListener instances. Typically invoked early in a delivery flow.
 */
export class PushImpact extends FulfillableGoalWithRegistrations<PushImpactListenerRegistration> {

    constructor(goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("push-impact"),
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("push-impact"), PushImpactDefinition),
        }, ...dependsOn);

        this.addFulfillment({
            name: `push-impact-${this.definition.uniqueName}`,
            goalExecutor: executePushImpact(this.registrations),
        });
    }

    public withListener(listener: PushImpactListener<any>): this {
        return this.with({
            name: DefaultGoalNameGenerator.generateName("push-impact-listener"),
            action: listener,
        });
    }
}

const PushImpactDefinition: GoalDefinition = {
    uniqueName: "push-impact",
    displayName: "push impact",
    environment: IndependentOfEnvironment,
    workingDescription: "Running push impact analysis",
    completedDescription: "Completed push impact analysis",
};
