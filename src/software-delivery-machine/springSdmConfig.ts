import { logger } from "@atomist/automation-client";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { tagRepo } from "../common/listener/tagRepo";
import { mavenFingerprinter } from "../handlers/events/delivery/scan/fingerprint/maven/mavenFingerprinter";
import { checkstyleReviewer } from "../handlers/events/delivery/scan/review/checkstyle/checkstyleReviewer";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { OnDryRunBuildComplete } from "../handlers/events/dry-run/OnDryRunBuildComplete";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { disposeProjectHandler } from "./blueprint/deploy/dispose";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { presentPromotionInformation } from "./blueprint/deploy/presentPromotionInformation";
import { diff1 } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { requestDescription } from "./blueprint/issue/requestDescription";
import { PublishNewRepo } from "./blueprint/repo/publishNewRepo";
import { listChangedFiles } from "./blueprint/review/listChangedFiles";
import { logReview } from "./blueprint/review/logReview";
import { tryToUpgradeSpringBootVersion } from "./commands/editors/spring/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

/**
 * Configuration common to Spring SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} sdm
 * @param {{useCheckstyle: boolean}} opts
 */
export function configureSpringSdm(sdm: SoftwareDeliveryMachine, opts: { useCheckstyle: boolean }) {
    sdm.addNewIssueListeners(requestDescription)
        .addEditors(() => tryToUpgradeSpringBootVersion)
        .addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
            PublishNewRepo)
        .addProjectReviewers(logReview);
    if (opts.useCheckstyle) {
        const checkStylePath = process.env.CHECKSTYLE_PATH;
        if (!!checkStylePath) {
            this.addProjectReviewers(checkstyleReviewer(checkStylePath));
        } else {
            logger.warn("Skipping Checkstyle; to enable it, set CHECKSTYLE_PATH env variable to the location of a downloaded checkstyle jar");
        }
    }

    sdm.addCodeReactions(listChangedFiles)
        .addFingerprinters(mavenFingerprinter)
        .addFingerprintDifferenceListeners(diff1)
        .addDeploymentListeners(PostToDeploymentsChannel)
        .addEndpointVerificationListeners(LookFor200OnEndpointRootGet)
        .addVerifiedDeploymentListeners(presentPromotionInformation)
        .addSupportingCommands(
            DescribeStagingAndProd,
            () => disposeProjectHandler,
        )
        .addSupportingEvents(OnDryRunBuildComplete);
}
