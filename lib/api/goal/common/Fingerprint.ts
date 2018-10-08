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

import { executeFingerprinting } from "../../../api-helper/listener/executeFingerprinting";
import { FingerprintListener } from "../../listener/FingerprintListener";
import { FingerprinterRegistration } from "../../registration/FingerprinterRegistration";
import { Goal } from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrationsAndListeners,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Goal that performs fingerprinting. Typically invoked early in a delivery flow.
 */
export class Fingerprint
    extends FulfillableGoalWithRegistrationsAndListeners<FingerprinterRegistration, FingerprintListener> {

    constructor(private readonly goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("fingerprint"),
                ...dependsOn: Goal[]) {

        super({
            ...FingerprintGoal.definition,
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("fingerprint")),
            displayName: "fingerprint",
        }, ...dependsOn);

        this.addFulfillment({
            name: `fingerprint-${this.definition.uniqueName}`,
            goalExecutor: executeFingerprinting(this.registrations,
                this.listeners),
        });
    }
}

const FingerprintGoal = new Goal({
    uniqueName: "fingerprint",
    displayName: "fingerprint",
    environment: IndependentOfEnvironment,
    workingDescription: "Running fingerprint calculations",
    completedDescription: "Fingerprinted",
});