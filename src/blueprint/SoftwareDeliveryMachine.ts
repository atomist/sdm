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

import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { Goal } from "../common/delivery/goals/Goal";
import { SdmGoalImplementationMapper } from "../common/delivery/goals/support/SdmGoalImplementationMapper";
import { GoalSetter } from "../common/listener/GoalSetter";
import { PushTest } from "../common/listener/PushTest";
import { FunctionalUnit } from "./FunctionalUnit";
import { GoalDrivenMachine } from "./GoalDrivenMachine";
import { SoftwareDeliveryMachineConfigurer } from "./SoftwareDeliveryMachineConfigurer";
import { ListenerRegistrationSupport } from "./support/ListenerRegistrationSupport";

/**
 * Class instantiated to create a **Software Delivery Machine**.
 * Combines commands and delivery event handling using _goals_.
 *
 * Goals and goal "implementations" can be defined by users.
 * However, certain well known goals are built into the TheSoftwareDeliveryMachine
 * for convenience, with their own associated listeners.
 *
 * Well known goal support is based around a delivery process spanning
 * common goals of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment.
 *
 * The most important element of a software delivery machine is setting
 * zero or more _push rules_ in the constructor.
 * This is normally done using the internal DSL as follows:
 *
 * ```
 * const sdm = new TheSoftwareDeliveryMachine(
 *    "MyMachine",
 *    options,
 *    whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(MaterialChangeToJavaRepo))
 *      .itMeans("No material change to Java")
 *      .setGoals(NoGoals),
 *    whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest)
 *      .itMeans("Spring Boot service to deploy")
 *      .setGoals(HttpServiceGoals));
 * ```
 *
 * Uses the builder pattern to allow fluent construction. For example:
 *
 * ```
 * softwareDeliveryMachine
 *    .addPushReactions(async pu => ...)
 *    .addNewIssueListeners(async i => ...)
 *    .add...;
 * ```
 */
export interface SoftwareDeliveryMachine extends GoalDrivenMachine, ListenerRegistrationSupport, FunctionalUnit {

    addDisposalRules(...goalSetters: GoalSetter[]): this;

    /**
     * Add generators to this machine
     * @param {Maker<HandleCommand>} g
     * @return {this}
     */
    addGenerators(...g: Array<Maker<HandleCommand>>): this;

    /**
     * Add editors to this machine
     * @param {Maker<HandleCommand>} e
     * @return {this}
     */
    addEditors(...e: Array<Maker<HandleCommand>>): this;

    /**
     * Add supporting commands for other functionality. Consider using
     * addCapabilities to group functionality
     * @param {Maker<HandleCommand>} e
     * @return {this}
     */
    addSupportingCommands(...e: Array<Maker<HandleCommand>>): this;

    /**
     * Add supporting events for other functionality. Consider using
     * addCapabilities to group functionality
     * @param {Maker<HandleCommand>} e
     * @return {this}
     */
    addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this;

    addFunctionalUnits(...fus: FunctionalUnit[]): this;

    /**
     * Declare that a goal will become successful based on something outside.
     * For instance, ArtifactGoal succeeds because of an ImageLink event.
     * This tells the SDM that it does not need to run anything when this
     * goal becomes ready.
     * @param {Goal} goal
     * @param {string} sideEffectName
     * @param {PushTest} pushTest
     */
    knownSideEffect(goal: Goal, sideEffectName: string,
                    pushTest: PushTest);

    /**
     * Add the given capabilities from these configurers
     * @param {SoftwareDeliveryMachineConfigurer} configurers
     * @return {this}
     */

    addCapabilities(...configurers: SoftwareDeliveryMachineConfigurer[]): this;

    /**
     * Let a single configurer configure this SDM
     * @param {SoftwareDeliveryMachineConfigurer} configurer
     * @return {this}
     */
    configure(configurer: SoftwareDeliveryMachineConfigurer): this;

    // TODO this should be an interface
    readonly goalFulfillmentMapper: SdmGoalImplementationMapper;

}
