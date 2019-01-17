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

import { CloneOptions } from "@atomist/automation-client";
import { executeAutoInspects } from "../../../api-helper/listener/executeAutoInspects";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { AutoInspectRegistration } from "../../registration/AutoInspectRegistration";
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
    /**
     * Report code inspection results to slack
     */
    reportToSlack?: boolean;

    /**
     * In case more Git history is required for running the code inspection, pass
     * appropriate CloneOptions
     * By default only a shallow clone with depth push.commits.length + 1 is executed
     */
    cloneOptions?: CloneOptions;
}

const DefaultAutoCodeInspectionOptions: AutoCodeInspectionOptions = {
    reportToSlack: true,
};

/**
 * Goal that runs code inspections
 */
export class AutoCodeInspection
    extends FulfillableGoalWithRegistrationsAndListeners<AutoInspectRegistration<any, any>, ReviewListenerRegistration> {

    constructor(private readonly details: FulfillableGoalDetails & AutoCodeInspectionOptions = {},
                ...dependsOn: Goal[]) {
        super({
            ...getGoalDefinitionFrom(details, DefaultGoalNameGenerator.generateName("code-inspection"), CodeInspectionDefintion),
        }, ...dependsOn);

        const optsToUse = {
            reportToSlack: DefaultAutoCodeInspectionOptions.reportToSlack,
            ...details,
        };

        this.addFulfillment({
            name: `code-inspections-${this.definition.uniqueName}`,
            goalExecutor: executeAutoInspects({
                reportToSlack: optsToUse.reportToSlack,
                cloneOptions: optsToUse.cloneOptions,
                registrations: this.registrations,
                listeners: this.listeners,
            }),
            logInterpreter: LogSuppressor,
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
