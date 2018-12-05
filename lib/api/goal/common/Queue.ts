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

import { Success } from "@atomist/automation-client";
import { conditionQueueGoalSet } from "../../../api-helper/listener/executeQueue";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { IndependentOfEnvironment } from "../support/environment";
import { createPredicatedGoalExecutor } from "./createGoal";

/**
 * Options to configure the Queue goal
 */
export interface QueueOptions {
    concurrent?: number;
    fetch?: number;
    retries?: number;
    interval?: number;
}

export const DefaultQueueOptions: QueueOptions = {
    concurrent: 2,
    fetch: 50,
    retries: 120,
    interval: 30000, // 120 retries every 30s means we are trying for 60mins and then giving up
};

/**
 * Goal to queue current goal set until it is the first in the list and can execute
 */
export class Queue extends FulfillableGoal {

    constructor(private readonly options: FulfillableGoalDetails & QueueOptions = DefaultQueueOptions,
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(options, DefaultGoalNameGenerator.generateName("queue"), QueueDefinition),
        }, ...dependsOn);

        const optsToUse: QueueOptions = {
            ...DefaultQueueOptions,
            ...options,
        };

        this.addFulfillment({
            name: `cancel-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: createPredicatedGoalExecutor(
                this.definition.uniqueName,
                async () => {
                    // When we get here, the wait condition was successful and the goal set should proceed
                    return Success;
                },
                {
                    timeoutMillis: optsToUse.interval,
                    retries: optsToUse.retries,
                    condition: conditionQueueGoalSet(this.options),
                }),
        });
    }
}

const QueueDefinition: GoalDefinition = {
    uniqueName: "queue",
    displayName: "queue goals",
    environment: IndependentOfEnvironment,
    workingDescription: "Queued",
    completedDescription: "Started goals",
    failedDescription: "Failed to queue goals",
};
