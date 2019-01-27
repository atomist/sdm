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
    AutofixProgressReporter,
    executeAutofixes,
} from "../../../api-helper/listener/executeAutofixes";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { AutofixRegistration } from "../../registration/AutofixRegistration";
import { CodeTransform } from "../../registration/CodeTransform";
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
 * Goal that performs autofixes: For example, linting and adding license headers.
 */
export class Autofix extends FulfillableGoalWithRegistrations<AutofixRegistration> {

    constructor(private readonly goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("autofix"),
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("autofix"), AutofixDefinition),
        }, ...dependsOn);

        this.addFulfillment({
            name: `autofix-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeAutofixes(this.registrations),
            progressReporter: AutofixProgressReporter,
        });
    }

    /**
     * Add given transform to this Autofix goal
     * @param transform
     * @param name
     */
    public withTransform(transform: CodeTransform<any>,
                         name: string = DefaultGoalNameGenerator.generateName("autofix-transform")): this {
        this.with({
            name,
            transform,
        });
        return this;
    }
}

const AutofixDefinition: GoalDefinition = {
    uniqueName: "autofix",
    displayName: "autofix",
    environment: IndependentOfEnvironment,
    workingDescription: "Applying autofixes",
    completedDescription: "No autofixes applied",
    failedDescription: "Autofixes failed",
    stoppedDescription: "Autofixes applied",
    isolated: true,
};
