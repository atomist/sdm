import { logger } from "@atomist/automation-client";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { AnyPush, PhaseCreator, PushesToMaster } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { ScanContext } from "../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { checkstyleReviewer } from "../handlers/events/delivery/review/checkstyle/checkstyleReviewer";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { OnDryRunBuildComplete } from "../handlers/events/dry-run/OnDryRunBuildComplete";
import { tagRepo } from "../handlers/events/repo/tagRepo";
import { BuildableSoftwareDeliveryMachine } from "../sdm-support/BuildableSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm-support/ReferenceDeliveryBlueprint";
import { LocalMavenBuildOnSuccessStatus } from "./blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { disposeProjectHandler } from "./blueprint/deploy/dispose";
import { LocalMavenDeployOnImageLinked } from "./blueprint/deploy/mavenDeploy";
import { offerPromotionCommand, presentPromotionButton } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { mavenFingerprinter } from "./blueprint/fingerprint/maven/mavenFingerprinter";
import { diff1 } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { requestDescription } from "./blueprint/issue/requestDescription";
import { buildPhaseBuilder, jvmPhaseBuilder } from "./blueprint/phase/phaseManagement";
import { PublishNewRepo } from "./blueprint/repo/publishNewRepo";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { logReactor, logReview } from "./blueprint/review/scan";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { tryToUpgradeSpringBootVersion } from "./commands/editors/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

const LocalMavenDeployer = LocalMavenDeployOnImageLinked;

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function springPCFSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): BuildableSoftwareDeliveryMachine {
    const sdm = new BuildableSoftwareDeliveryMachine([HttpServicePhases, LibraryPhases],
        ScanContext,
        LocalMavenBuildOnSuccessStatus,
        // CloudFoundryStagingDeployOnSuccessStatus;
        () => LocalMavenDeployer);
    sdm.addPromotedEnvironment(promotedEnvironment);
    configureSpringSdm(sdm, opts);
    return sdm;
}

export function configureSpringSdm(sdm: BuildableSoftwareDeliveryMachine, opts: { useCheckstyle: boolean }) {
    sdm
        .addNewIssueListeners(requestDescription)
        .addEditors(() => tryToUpgradeSpringBootVersion)
        .addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
            groupId: "myco",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
            suggestAddingCloudFoundryManifest,
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

    sdm.addPhaseCreators(
        new PhaseCreator([jvmPhaseBuilder], PushesToMaster),
        new PhaseCreator([buildPhaseBuilder], AnyPush))
        .addCodeReactions(logReactor)
        .addFingerprinters(mavenFingerprinter)
        .addFingerprintDifferenceHandlers(diff1)
        .addDeploymentListeners(PostToDeploymentsChannel)
        .addEndpointVerificationListeners(LookFor200OnEndpointRootGet)
        .addVerifiedDeploymentListeners(presentPromotionButton)
        .addSupersededListeners(
            inv => {
                logger.info("Will undeploy application %j", inv.id);
                return LocalMavenDeployer.deployer.undeploy(inv.id);
            })
        .addSupportingCommands(
            () => addCloudFoundryManifest,
            DescribeStagingAndProd,
            () => disposeProjectHandler,
        )
        .addSupportingEvents(OnDryRunBuildComplete);
}
