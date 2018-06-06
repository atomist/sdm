import { logger } from "@atomist/automation-client";
import { whenPushSatisfies } from "../../../api/dsl/goalDsl";
import { FingerprintGoal, PushReactionGoal, ReviewGoal } from "../../../api/machine/wellKnownGoals";
import { hasFileWithExtension } from "../../../api/mapping/support/commonPushTests";
import { TypedFingerprint } from "../../../code/fingerprint/TypedFingerprint";
import { WellKnownGoals } from "../../../pack/well-known-goals/addWellKnownGoals";
import { LogFingerprint } from "../../io/logFingerprint";
import { LocalSoftwareDeliveryMachine } from "../../machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../../machine/localSoftwareDeliveryMachineConfiguration";

export const RepositoryOwnerParentDirectory = "/Users/rodjohnson/temp/local-sdm";

export const sdm = new LocalSoftwareDeliveryMachine(
    "gitMachine",
    localSoftwareDeliveryMachineOptions(RepositoryOwnerParentDirectory),
    whenPushSatisfies(() => true).setGoals([
        FingerprintGoal, PushReactionGoal, ReviewGoal,
    ]));

sdm
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
    .addPushReactions(async p => p.addressChannels("Gotcha!"))
    .addPushReactions({
        name: "thing",
        pushTest: hasFileWithExtension("md"),
        action: async pu => {
            const hasReadme = !!(await pu.project.getFile("README.md"));
            return pu.addressChannels(`Project at ${pu.id.url} has readme=${hasReadme}`);
        },
    });
