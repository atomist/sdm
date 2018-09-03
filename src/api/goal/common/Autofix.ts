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

import { executeAutofixes } from "../../../api-helper/listener/executeAutofixes";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { AutofixGoal } from "../../machine/wellKnownGoals";
import { AutofixRegistration } from "../../registration/AutofixRegistration";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import { FulfillableGoalWithRegistrations } from "../GoalWithFulfillment";

/**
 * Goal that performs autofixes: For example, linting and adding license headers.
 */
export class Autofix extends FulfillableGoalWithRegistrations<AutofixRegistration> {

    constructor(private readonly uniqueName: string = DefaultGoalNameGenerator.generateName("autofix")) {

        super({
            ...AutofixGoal.definition,
            uniqueName,
            orderedName: `0.2-${uniqueName.toLowerCase()}`,
        });

        this.addFulfillment({
            name: "autofix",
            logInterpreter: LogSuppressor,
            goalExecutor: executeAutofixes(this.registrations),
        });
    }
}
