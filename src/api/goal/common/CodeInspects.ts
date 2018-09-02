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
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { sdmInstance } from "../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../machine/SoftwareDeliveryMachine";
import { CodeInspectionGoal } from "../../machine/wellKnownGoals";
import { CodeInspectionRegistration } from "../../registration/CodeInspectionRegistration";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that runs code inspections
 */
export class CodeInspects extends FulfillableGoalWithRegistrations<CodeInspectionRegistration<any>> {

    constructor(private readonly uniqueName: string,
                sdm: SoftwareDeliveryMachine = sdmInstance()) {

        super({
            ...CodeInspectionGoal.definition,
            uniqueName,
            orderedName: `1-${uniqueName.toLowerCase()}`,
        }, sdm);

        this.addFulfillment({
            name: `Inspect-${this.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor:  executeAutoInspects(
                this.sdm.configuration.sdm.projectLoader,
                this.registrations,
                this.sdm.reviewListenerRegistrations),
        });
    }
}
