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

import { Goal } from "../../../api/goal/Goal";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    getGoalDefinitionFrom,
    ImplementationRegistration,
} from "../../../api/goal/GoalWithFulfillment";
import { AnyPush } from "../../../api/mapping/support/commonPushTests";
import {
    executeVersioner,
    ProjectVersioner,
} from "../../internal/delivery/build/local/projectVersioner";

/**
 * Register a ProjectVersioner for a certain type of push
 */
export interface ProjectVersionerRegistration extends Partial<ImplementationRegistration> {
    versioner: ProjectVersioner;
}

/**
 * Goal that performs project visioning: For example using Maven to increment the project version number
 */
export class Version extends FulfillableGoalWithRegistrations<ProjectVersionerRegistration> {

    constructor(goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("version"),
                ...dependsOn: Goal[]) {

        super({
            workingDescription: "Calculating project version",
            completedDescription: "Versioned",
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("version")),
            displayName: "version",
        }, ...dependsOn);
    }

    public with(registration: ProjectVersionerRegistration): this {
        this.addFulfillment({
            goalExecutor: executeVersioner(registration.versioner),
            name: DefaultGoalNameGenerator.generateName("versioner"),
            ...registration as ImplementationRegistration,
        });
        return this;
    }

    public withVersioner(versioner: ProjectVersioner): this {
        this.with({
            name: DefaultGoalNameGenerator.generateName("versioner"),
            pushTest: AnyPush,
            versioner,
        });
        return this;
    }
}
