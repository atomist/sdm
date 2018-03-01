import { logger } from "@atomist/automation-client";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { PromotedEnvironment } from "../blueprint/ReferenceDeliveryBlueprint";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { tagRepo } from "../common/listener/tagRepo";
import { mavenFingerprinter } from "../handlers/events/delivery/scan/fingerprint/maven/mavenFingerprinter";
import { checkstyleReviewer } from "../handlers/events/delivery/scan/review/checkstyle/checkstyleReviewer";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { OnDryRunBuildComplete } from "../handlers/events/dry-run/OnDryRunBuildComplete";
import { LocalBuildOnSuccessStatus } from "./blueprint/build/localBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { disposeProjectHandler } from "./blueprint/deploy/dispose";
import { LocalSpringBootDeployOnSuccessStatus } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { offerPromotionCommand, presentPromotionButton } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { diff1 } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { requestDescription } from "./blueprint/issue/requestDescription";
import { JavaLibraryPhaseCreator, SpringBootDeployPhaseCreator } from "./blueprint/phase/jvmPhaseManagement";
import { NodePhaseCreator } from "./blueprint/phase/nodePhaseManagement";
import { PublishNewRepo } from "./blueprint/repo/publishNewRepo";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { listChangedFiles, logReview } from "./blueprint/review/scan";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { tryToUpgradeSpringBootVersion } from "./commands/editors/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

const LocalMavenDeployer = LocalSpringBootDeployOnSuccessStatus;

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export function cloudFoundrySoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        LocalBuildOnSuccessStatus,
        // CloudFoundryStagingDeployOnSuccessStatus;
        () => LocalMavenDeployer);
    sdm.addPromotedEnvironment(promotedEnvironment);
    configureSpringSdm(sdm, opts);
    return sdm;
}

export function configureSpringSdm(sdm: SoftwareDeliveryMachine, opts: { useCheckstyle: boolean }) {
    sdm.addPhaseCreators(
        new SpringBootDeployPhaseCreator(),
        new NodePhaseCreator(),
        new JavaLibraryPhaseCreator(),
    );

    sdm.addNewIssueListeners(requestDescription)
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

    sdm.addCodeReactions(listChangedFiles)
        .addFingerprinters(mavenFingerprinter)
        .addFingerprintDifferenceListeners(diff1)
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
