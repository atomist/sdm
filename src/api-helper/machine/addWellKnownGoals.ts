import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import {
    ArtifactGoal,
    AutofixGoal, DeleteAfterUndeploysGoal,
    DeleteRepositoryGoal,
    FingerprintGoal,
    NoGoal,
    PushReactionGoal,
    ReviewGoal,
} from "../../api/machine/wellKnownGoals";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { executeImmaterial } from "../../handlers/events/delivery/goals/SetGoalsOnPush";
import { executeFingerprinting } from "../../internal/delivery/code/fingerprint/executeFingerprinting";
import { offerToDeleteRepository } from "../../internal/delivery/deploy/executeUndeploy";
import { LogSuppressor } from "../../internal/delivery/goals/support/logInterpreters";
import { SendFingerprintToAtomist } from "../../util/webhook/sendFingerprintToAtomist";
import { executeAutofixes } from "../listener/executeAutofixes";
import { executePushReactions } from "../listener/executePushReactions";
import { executeReview } from "../listener/executeReview";

/**
 * Add well known goals to the given SDM
 * @param {SoftwareDeliveryMachine} sdm
 */
export function addWellKnownGoals(sdm: SoftwareDeliveryMachine) {
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
                sdm.fingerprintListeners,
                SendFingerprintToAtomist))
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
