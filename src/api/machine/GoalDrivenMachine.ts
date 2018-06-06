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

import { InterpretLog } from "../../spi/log/InterpretedLog";
import { ExecuteGoalWithLog } from "../goal/ExecuteGoalWithLog";
import { Goal } from "../goal/Goal";
import { Goals } from "../goal/Goals";
import { SdmGoalImplementationMapper } from "../goal/support/SdmGoalImplementationMapper";
import { GoalSetter } from "../mapping/GoalSetter";
import { PushMapping } from "../mapping/PushMapping";
import { PushTest } from "../mapping/PushTest";
import { MachineConfiguration } from "./MachineConfiguration";
import {
    SoftwareDeliveryMachineConfiguration,
} from "./SoftwareDeliveryMachineOptions";

/**
 * Interface for machines driven by configurable goals.
 * Goals and goal "implementations" can be defined by users.
 */
export interface GoalDrivenMachine<O extends SoftwareDeliveryMachineConfiguration> extends MachineConfiguration<O> {

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    pushMapping: PushMapping<Goals>;

    /**
     * Return if this SDM purely observes, rather than changes things in an org.
     * Note that this cannot be 100% reliable, as arbitrary event handlers
     * could be making commits, initiating deployments etc.
     * @return {boolean}
     */
    observesOnly: boolean;

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoalWithLog} goalExecutor
     * @param options PushTest to narrow matching & InterpretLog that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    addGoalImplementation(implementationName: string,
                          goal: Goal,
                          goalExecutor: ExecuteGoalWithLog,
                          options?: Partial<{
                              pushTest: PushTest,
                              logInterpreter: InterpretLog,
                          }>): this;

    /**
     * Declare that a goal will become successful based on something outside.
     * For instance, ArtifactGoal succeeds because of an ImageLink event.
     * This tells the SDM that it does not need to run anything when this
     * goal becomes ready.
     * @param {Goal} goal
     * @param {string} sideEffectName
     * @param {PushTest} pushTest
     */
    addKnownSideEffect(goal: Goal, sideEffectName: string,
                       pushTest: PushTest): this;

    readonly goalFulfillmentMapper: SdmGoalImplementationMapper;

    /**
     * Add goal setting contributions that will be added into SDM goal setting.
     * Decorates other goal setting behavior.
     * @param goalContributions contributions to goals
     */
    addGoalContributions(goalContributions: GoalSetter): this;

}
