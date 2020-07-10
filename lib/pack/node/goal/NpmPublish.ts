/*
 * Copyright © 2020 Atomist, Inc.
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

import { Goal, GoalDefinition } from "../../../api/goal/Goal";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    getGoalDefinitionFrom,
    ImplementationRegistration,
} from "../../../api/goal/GoalWithFulfillment";
import { IndependentOfEnvironment } from "../../../api/goal/support/environment";
import { executePublish, NpmOptions } from "../build/executePublish";
import { NodeProjectIdentifier } from "../build/nodeProjectIdentifier";

export interface NpmPublishRegistration extends ImplementationRegistration {
    options: NpmOptions;
}

/**
 * Goal that performs NPM registry publication
 */
export class NpmPublish extends FulfillableGoalWithRegistrations<NpmPublishRegistration> {
    private static readonly defaultGoalName: string = DefaultGoalNameGenerator.generateName("npm-publish");

    constructor(
        goalDetailsOrUniqueName: FulfillableGoalDetails | string = NpmPublish.defaultGoalName,
        ...dependsOn: Goal[]
    ) {
        super(
            {
                ...PublishDefiniton,
                ...getGoalDefinitionFrom(goalDetailsOrUniqueName, NpmPublish.defaultGoalName),
            },
            ...dependsOn,
        );
    }

    public with(registration: NpmPublishRegistration): this {
        this.addFulfillment({
            name: registration.name,
            goalExecutor: executePublish(NodeProjectIdentifier, registration.options),
            pushTest: registration.pushTest,
            logInterpreter: registration.logInterpreter,
            progressReporter: registration.progressReporter,
        });
        return this;
    }
}

const PublishDefiniton: GoalDefinition = {
    uniqueName: "publish",
    environment: IndependentOfEnvironment,
    displayName: "publish",
    workingDescription: "Publishing",
    completedDescription: "Published",
    failedDescription: "Publish failed",
    isolated: true,
};
