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
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { FingerprintGoal } from "../../machine/wellKnownGoals";
import { FingerprinterRegistration } from "../../registration/FingerprinterRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that performs fingerprinting. Typically invoked early in a delivery flow.
 */
export class Fingerprint extends FulfillableGoalWithRegistrations<FingerprinterRegistration> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...FingerprintGoal.definition,
            uniqueName,
            orderedName: `0.1-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `Fingerprint-${this.uniqueName}`,
            goalExecutor: executeFingerprinting(
                this.sdm.configuration.sdm.projectLoader,
                this.registrations,
                this.sdm.fingerprintListeners),
        });
    }
}
