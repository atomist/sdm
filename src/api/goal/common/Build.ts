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

import { executeBuild } from "../../../api-helper/goal/executeBuild";
import { Builder } from "../../../spi/build/Builder";
import { BuildGoal } from "../../machine/wellKnownGoals";
import { Goal } from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoalWithRegistrations,
    ImplementationRegistration,
} from "../GoalWithFulfillment";

/**
 * Register a Builder for a certain type of push
 */
export interface BuilderRegistration extends ImplementationRegistration {
    builder: Builder;
}

/**
 * Goal that performs builds: For example using a Maven or NPM Builder implementation
 */
export class Build extends FulfillableGoalWithRegistrations<BuilderRegistration> {

    constructor(private readonly uniqueName: string = DefaultGoalNameGenerator.generateName("build"),
                ...dependsOn: Goal[]) {

        super({
            ...BuildGoal.definition,
            uniqueName,
            displayName: "build",
        }, ...dependsOn);
    }

    public with(registration: BuilderRegistration): this {
        this.addFulfillment({
            goalExecutor: executeBuild(registration.builder),
            ...registration as ImplementationRegistration,
        });
        return this;
    }
}
