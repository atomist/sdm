import { logger } from "@atomist/automation-client";
import * as assert from "power-assert";
import { whenPushSatisfies } from "../../src/api/dsl/goalDsl";
import { AutofixGoal } from "../../src/api/machine/wellKnownGoals";
import { hasFileWithExtension } from "../../src/api/mapping/support/commonPushTests";
import { AutofixRegistration } from "../../src/api/registration/AutofixRegistration";
import { TypedFingerprint } from "../../src/code/fingerprint/TypedFingerprint";
import { RepositoryOwnerParentDirectory } from "../../src/local/invocation/git/machine";
import { LogFingerprint } from "../../src/local/io/logFingerprint";
import { LocalSoftwareDeliveryMachine } from "../../src/local/machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../../src/local/machine/localSoftwareDeliveryMachineConfiguration";
import { WellKnownGoals } from "../../src/pack/well-known-goals/addWellKnownGoals";
import { HatesTheWorld } from "../common/delivery/code/review/executeReviewTest";

describe("LocalSoftwareDeliveryMachine push", () => {

    it("should expose push reaction", async () => {
        const repoOwnerDirectory = RepositoryOwnerParentDirectory;
        const sdm = new LocalSoftwareDeliveryMachine(
            "name",
            localSoftwareDeliveryMachineOptions(repoOwnerDirectory),
            whenPushSatisfies(() => true).setGoals([
                AutofixGoal,
                // FingerprintGoal, ReviewGoal, PushReactionGoal
            ]))
            .addFingerprintListeners(LogFingerprint)
            .addExtensionPacks(WellKnownGoals)
            .addFingerprinterRegistrations({
                name: "fp1",
                action: async pu => {
                    const fp = new TypedFingerprint("name", "NM", "0.1.0", {name: "tom"});
                    logger.info("Computed fingerprint %j", fp);
                    return fp;
                },
            })
            .addAutofixes(AddThingAutofix)
            .addReviewerRegistrations(HatesTheWorld)
            .addReviewListeners(async r => {
                logger.info("REVIEW: %j", r.review);
            })
            .addPushReactions(async p => p.addressChannels("Gotcha!"))
            .addPushReactions({
                name: "thing",
                pushTest: hasFileWithExtension("md"),
                action: async pu => {
                    const hasReadme = !!(await pu.project.getFile("README.md"));
                    return pu.addressChannels(`Project at ${pu.id.url} has readme=${hasReadme}`);
                },
            });
        assert.equal(sdm.pushReactionRegistrations.length, 2);

        await sdm.postCommit(
            `${sdm.configuration.repositoryOwnerParentDirectory}/johnsonr/java-hello-world-maven`,
            "master",
            "84b742a67d68ccc488c7ced9587333724b9fc162");
    }).timeout(40000);

});

export const AddThingAutofix: AutofixRegistration = {
    name: "AddThing",
    action: async cri => {
        await cri.project.addFile("thing", "1");
        return {edited: true, success: true, target: cri.project};
    },
};
