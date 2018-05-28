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

import * as _ from "lodash";
import {
    ArtifactGoal,
    AutofixGoal,
    DeleteAfterUndeploysGoal,
    DeleteRepositoryGoal,
    FingerprintGoal,
    NoGoal,
    PushReactionGoal,
    ReviewGoal,
} from "../blueprint/wellKnownGoals";
import { createRepoHandler } from "../common/command/generator/createRepo";
import { listGeneratorsHandler } from "../common/command/generator/listGenerators";
import { executeAutofixes } from "../common/delivery/code/autofix/executeAutofixes";
import { executePushReactions } from "../common/delivery/code/executePushReactions";
import { executeFingerprinting } from "../common/delivery/code/fingerprint/executeFingerprinting";
import { executeReview } from "../common/delivery/code/review/executeReview";
import { offerToDeleteRepository } from "../common/delivery/deploy/executeUndeploy";
import { LogSuppressor } from "../common/delivery/goals/support/logInterpreters";
import { GoalSetter } from "../common/listener/GoalSetter";
import { selfDescribeHandler } from "../handlers/commands/SelfDescribe";
import { executeImmaterial } from "../handlers/events/delivery/goals/SetGoalsOnPush";
import { SoftwareDeliveryMachineOptions } from "./SoftwareDeliveryMachineOptions";
import { AbstractSoftwareDeliveryMachine } from "./support/AbstractSoftwareDeliveryMachine";

/**
 * Class instantiated to create a **Software Delivery Machine**.
 * Combines commands and delivery event handling using _goals_.
 *
 * Goals and goal "implementations" can be defined by users.
 * However, certain well known goals are built into the DefaultSoftwareDeliveryMachine
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
 * const sdm = new DefaultSoftwareDeliveryMachine(
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
export class DefaultSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    /**
     * Construct a new software delivery machine, with zero or
     * more goal setters.
     * @param {string} name
     * @param {SoftwareDeliveryMachineOptions} opts
     * @param {GoalSetter} goalSetters tell me what to do on a push. Hint: start with "whenPushSatisfies(...)"
     */
    constructor(name: string,
                opts: SoftwareDeliveryMachineOptions,
                ...goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super(name, opts);
        this.goalSetters = _.flatten(goalSetters);
        this.addSupportingCommands(
            selfDescribeHandler(this),
            listGeneratorsHandler(this),
            createRepoHandler(this),
        );

        this.addGoalImplementation("Autofix", AutofixGoal,
            executeAutofixes(this.opts.projectLoader, this.autofixRegistrations), {
                // Autofix errors should not be reported to the user
                logInterpreter: LogSuppressor,
            })
            .addGoalImplementation("DoNothing", NoGoal, executeImmaterial)
            .addGoalImplementation("FingerprinterRegistration", FingerprintGoal,
                executeFingerprinting(this.opts.projectLoader, this.fingerprinterRegistrations, this.fingerprintListeners))
            .addGoalImplementation("CodeReactions", PushReactionGoal,
                executePushReactions(this.opts.projectLoader, this.pushReactionRegistrations))
            .addGoalImplementation("Reviews", ReviewGoal,
                executeReview(this.opts.projectLoader, this.reviewerRegistrations, this.reviewListeners))
            .addVerifyImplementation()
            .addGoalImplementation("OfferToDeleteRepo", DeleteRepositoryGoal,
                offerToDeleteRepository())
            .addGoalImplementation("OfferToDeleteRepoAfterUndeploys", DeleteAfterUndeploysGoal,
                offerToDeleteRepository());
        this.knownSideEffect(ArtifactGoal, "from ImageLinked");
    }

}
