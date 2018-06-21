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

import { executeImmaterial } from "../../api-helper/goal/chooseAndSetGoals";
import { executeAutofixes } from "../../api-helper/listener/executeAutofixes";
import { executePushReactions } from "../../api-helper/listener/executePushReactions";
import { executeReview } from "../../api-helper/listener/executeReview";
import { LogSuppressor } from "../../api-helper/log/logInterpreters";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import {
    ArtifactGoal,
    AutofixGoal,
    DeleteAfterUndeploysGoal,
    DeleteRepositoryGoal,
    FingerprintGoal,
    NoGoal,
    PushReactionGoal,
    ReviewGoal,
} from "../../api/machine/wellKnownGoals";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { offerToDeleteRepository } from "../../handlers/commands/deleteRepository";
import { executeFingerprinting } from "../../internal/delivery/code/fingerprint/executeFingerprinting";

/**
 * Add well known goals to the given SDM
 * @param {SoftwareDeliveryMachine} sdm
 */
export const WellKnownGoals: ExtensionPack = {
    name: "WellKnownGoals",
    vendor: "Atomist",
    version: "0.1.0",
    configure,
};

function configure(sdm: SoftwareDeliveryMachine) {
    sdm.addGoalImplementation("Autofix", AutofixGoal,
        executeAutofixes(
            sdm.configuration.sdm.projectLoader,
            sdm.autofixRegistrations,
            sdm.configuration.sdm.repoRefResolver), {
            // Autofix errors should not be reported to the user
            logInterpreter: LogSuppressor,
        })
        .addGoalImplementation("DoNothing", NoGoal, executeImmaterial)
        .addGoalImplementation("FingerprinterRegistration", FingerprintGoal,
            executeFingerprinting(
                sdm.configuration.sdm.projectLoader,
                sdm.fingerprinterRegistrations,
                sdm.fingerprintListeners))
        .addGoalImplementation("CodeReactions", PushReactionGoal,
            executePushReactions(sdm.configuration.sdm.projectLoader, sdm.pushReactionRegistrations))
        .addGoalImplementation("Reviews", ReviewGoal,
            executeReview(sdm.configuration.sdm.projectLoader, sdm.reviewerRegistrations, sdm.reviewListeners))
        .addVerifyImplementation()
        .addGoalImplementation("OfferToDeleteRepo", DeleteRepositoryGoal,
            offerToDeleteRepository())
        .addGoalImplementation("OfferToDeleteRepoAfterUndeploys", DeleteAfterUndeploysGoal,
            offerToDeleteRepository());
    sdm.addKnownSideEffect(ArtifactGoal, "from ImageLinked", AnyPush);
}
