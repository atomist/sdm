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
import { CodeInspectionGoal } from "../../machine/wellKnownGoals";
import { CodeInspectionRegistration } from "../../registration/CodeInspectionRegistration";
import { ReviewListenerRegistration } from "../../registration/ReviewListenerRegistration";
import { Goal } from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import { FulfillableGoalWithRegistrationsAndListeners } from "../GoalWithFulfillment";

/**
 * Goal that runs code inspections
 */
export class AutoCodeInspection
    extends FulfillableGoalWithRegistrationsAndListeners<CodeInspectionRegistration<any, any>, ReviewListenerRegistration> {

    constructor(private readonly uniqueName: string = DefaultGoalNameGenerator.generateName("code-inspections"),
                ...dependsOn: Goal[]) {

        super({
            ...CodeInspectionGoal.definition,
            uniqueName,
            displayName: "code-inspections",
        }, ...dependsOn);

        this.addFulfillment({
            name: `Inspect-${this.uniqueName}`,
            goalExecutor: executeAutoInspects(this.registrations, this.listeners),
        });
    }
}
