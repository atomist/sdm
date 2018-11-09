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

import { executeAutoInspects } from "../../../api-helper/listener/executeAutoInspects";
import { CodeInspectionRegistration } from "../../registration/CodeInspectionRegistration";
import { ReviewListenerRegistration } from "../../registration/ReviewListenerRegistration";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrationsAndListeners,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Options to configure the behavior of the AutoCodeInspection goal.
 */
export interface AutoCodeInspectionOptions {
    reportToSlack?: boolean;
}

const DefaultAutoCodeInspectionOptions: AutoCodeInspectionOptions = {
    reportToSlack: true,
};

/**
 * Goal that runs code inspections
 */
export class AutoCodeInspection
    extends FulfillableGoalWithRegistrationsAndListeners<CodeInspectionRegistration<any, any>, ReviewListenerRegistration> {

    constructor(private readonly details: FulfillableGoalDetails & AutoCodeInspectionOptions = {},
                ...dependsOn: Goal[]) {
        super({
            ...CodeInspectionDefintion,
            ...getGoalDefinitionFrom(details, DefaultGoalNameGenerator.generateName("code-inspection")),
        }, ...dependsOn);

        const optsToUse = {
            reportToSlack: DefaultAutoCodeInspectionOptions.reportToSlack,
            ...details,
        };

        this.addFulfillment({
            name: `code-inspections-${this.definition.uniqueName}`,
            goalExecutor: executeAutoInspects({
                reportToSlack: optsToUse.reportToSlack,
                registrations: this.registrations,
                listeners: this.listeners,
            }),
        });
    }
}

const CodeInspectionDefintion: GoalDefinition = {
    uniqueName: "code-inspection",
    displayName: "code inspection",
    environment: IndependentOfEnvironment,
    workingDescription: "Running code inspections",
    completedDescription: "Code inspections passed",
};
