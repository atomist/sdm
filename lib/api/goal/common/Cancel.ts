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

import { executeCancelGoalSets } from "../../../api-helper/listener/executeCancel";
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { SdmGoalState } from "../../../typings/types";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import { Goals } from "../Goals";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { SdmGoalEvent } from "../SdmGoalEvent";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Options to configure the Cancel goal
 */
export interface CancelOptions {

    /**
     * Goals that should be canceled if they are in a state that allows cancellation
     */
    goals: Array<Goal | Goals>;

    /**
     * Filter goals to cancel based on goalSet or state
     * @param goalSet
     */
    goalFilter?: (goal: SdmGoalEvent) => boolean;
}

const DefaultCancelOptions: CancelOptions = {
    goals: [],
    goalFilter: g => g.state === SdmGoalState.in_process ||
        g.state === SdmGoalState.planned ||
        g.state === SdmGoalState.requested ||
        g.state === SdmGoalState.waiting_for_pre_approval ||
        g.state === SdmGoalState.pre_approved,
};

/**
 * Goal to cancel pending goals in goal sets of the previous commit on the same branch
 */
export class Cancel extends FulfillableGoal {

    constructor(private readonly options: FulfillableGoalDetails & CancelOptions = DefaultCancelOptions,
                ...dependsOn: Goal[]) {

        super({
            ...getGoalDefinitionFrom(options, DefaultGoalNameGenerator.generateName("cancel"), CancelDefinition),
        }, ...dependsOn);

        const optsToUse: CancelOptions = {
            goalFilter: DefaultCancelOptions.goalFilter,
            ...this.options,
        };

        this.addFulfillment({
            name: `cancel-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeCancelGoalSets(optsToUse, this.definition.uniqueName),
        });
    }
}

const CancelDefinition: GoalDefinition = {
    uniqueName: "cancel",
    displayName: "cancel pending goals",
    environment: IndependentOfEnvironment,
    workingDescription: "Canceling pending goals",
    completedDescription: "No pending goals canceled",
    failedDescription: "Failed to cancel pending goals",
};
