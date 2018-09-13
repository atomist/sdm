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
import { executeAutoInspects } from "../../api-helper/listener/executeAutoInspects";
import { executeFingerprinting } from "../../api-helper/listener/executeFingerprinting";
import { executePushReactions } from "../../api-helper/listener/executePushReactions";
import { LogSuppressor } from "../../api-helper/log/logInterpreters";
import { metadata } from "../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import {
    ArtifactGoal,
    AutofixGoal,
    CodeInspectionGoal,
    FingerprintGoal,
    NoGoal,
    PushReactionGoal,
} from "../../api/machine/wellKnownGoals";
import { AnyPush } from "../../api/mapping/support/commonPushTests";

/**
 * Add well known goals to the given SDM
 * @param {SoftwareDeliveryMachine} sdm
 */
export const WellKnownGoals: ExtensionPack = {
    ...metadata("well-known-goals"),
    configure,
};

function configure(sdm: SoftwareDeliveryMachine) {
    sdm.addGoalImplementation("Autofix", AutofixGoal,
        executeAutofixes(sdm.autofixRegistrations),
        {
            // Autofix errors should not be reported to the user
            logInterpreter: LogSuppressor,
        })
        .addGoalImplementation("DoNothing", NoGoal, executeImmaterial)
        .addGoalImplementation("FingerprinterRegistration", FingerprintGoal,
            executeFingerprinting(
                sdm.fingerprinterRegistrations,
                sdm.fingerprintListeners))
        .addGoalImplementation("CodeReactions", PushReactionGoal,
            executePushReactions(sdm.pushImpactListenerRegistrations))
        .addGoalImplementation("CodeInspections", CodeInspectionGoal,
            executeAutoInspects(sdm.autoInspectRegistrations, sdm.reviewListenerRegistrations))
        .addVerifyImplementation();
    sdm.addGoalSideEffect(ArtifactGoal, sdm.configuration.name, AnyPush);
}
