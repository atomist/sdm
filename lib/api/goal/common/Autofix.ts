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

import {
    AutofixProgressReporter,
    DefaultExtractAuthor,
    executeAutofixes,
    ExtractAuthor,
    GoalInvocationParameters,
} from "../../../api-helper/listener/executeAutofixes";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { AutofixRegistration } from "../../registration/AutofixRegistration";
import { CodeTransform } from "../../registration/CodeTransform";
import { TransformPresentation } from "../../registration/CodeTransformRegistration";
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
 * Extension to FulfillableGoalDetails to add optional TransformPresentation
 */
export interface AutofixGoalDetails extends FulfillableGoalDetails {

    /**
     * Optional TransformPresentation to use when pushing autofix commits to repositories.
     */
    transformPresentation?: TransformPresentation<GoalInvocationParameters>;

    /**
     * Optionally set autofix commit author to author of current head commit or to the
     * result of the provider ExtractAuthor function.
     */
    setAuthor?: boolean | ExtractAuthor;
}

/**
 * Goal that performs autofixes: For example, linting and adding license headers.
 */
export class Autofix extends FulfillableGoalWithRegistrations<AutofixRegistration<any>> {

    constructor(private readonly goalDetailsOrUniqueName: AutofixGoalDetails | string
                    = DefaultGoalNameGenerator.generateName("autofix"),
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("autofix"), AutofixDefinition),
        }, ...dependsOn);

        let transformPresentation;
        let extractAuthor: ExtractAuthor;
        if (!!goalDetailsOrUniqueName) {
            const autofixDetails = goalDetailsOrUniqueName as AutofixGoalDetails;

            if (!!autofixDetails.transformPresentation) {
                transformPresentation = autofixDetails.transformPresentation;
            }
            if (!!autofixDetails.setAuthor) {
                if (typeof autofixDetails.setAuthor === "boolean") {
                    extractAuthor = DefaultExtractAuthor;
                } else {
                    extractAuthor = autofixDetails.setAuthor;
                }
            }
        }

        this.addFulfillment({
            name: `autofix-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeAutofixes(this.registrations, transformPresentation, extractAuthor),
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
    workingDescription: "Evaluating autofixes",
    completedDescription: "No autofixes applied",
    failedDescription: "Autofixes failed",
    stoppedDescription: "Autofixes applied",
    isolated: true,
};
