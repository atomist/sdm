import { logger } from "@atomist/automation-client";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { AnyPush, PhaseCreator, PushesToMaster } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { ScanContext } from "../handlers/events/delivery/phases/gitHubContext";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { checkstyleReviewer } from "../handlers/events/delivery/review/checkstyle/checkstyleReviewer";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";
import { tagRepo } from "../handlers/events/repo/tagRepo";
import { BuildableSoftwareDeliveryMachine } from "../sdm-support/BuildableSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm-support/ReferenceDeliveryBlueprint";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion } from "./blueprint/deploy/k8sDeploy";
import { LocalMavenDeployOnImageLinked } from "./blueprint/deploy/mavenDeploy";
import { offerPromotionCommand, presentPromotionButton } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { mavenFingerprinter } from "./blueprint/fingerprint/maven/mavenFingerprinter";
import { buildPhaseBuilder, jvmPhaseBuilder } from "./blueprint/phase/phaseManagement";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { logReactor, logReview } from "./blueprint/review/scan";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

const LocalMavenDeployer = LocalMavenDeployOnImageLinked;

// CloudFoundryStagingDeployOnImageLinked

const promotedEnvironment: PromotedEnvironment = {

    name: "production",

    offerPromotionCommand,

    promote: DeployToProd,

    deploy: CloudFoundryProductionDeployOnFingerprint,
};

export class SpringK8sSoftwareDeliveryMachine extends BuildableSoftwareDeliveryMachine {

    constructor() {
        super([HttpServicePhases, LibraryPhases], ScanContext, K8sBuildOnSuccessStatus, K8sStagingDeployOnSuccessStatus);
        this.addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
            groupId: "myco",
        }))
            .addNewRepoWithCodeActions(
                tagRepo(springBootTagger),
                suggestAddingCloudFoundryManifest)
            .addProjectReviewers(logReview)
            .addSupportingEvents(() => NoticeK8sDeployCompletion);
        const checkStylePath = process.env.CHECKSTYLE_PATH;
        if (!!checkStylePath) {
            this.addProjectReviewers(checkstyleReviewer(checkStylePath));
        } else {
            logger.warn("Skipping Checkstyle; to enable it, set CHECKSTYLE_PATH env variable to the location of a downloaded checkstyle jar");
        }
        this.addPhaseCreators(
            new PhaseCreator([jvmPhaseBuilder], PushesToMaster),
            new PhaseCreator([buildPhaseBuilder], AnyPush));
        this.addCodeReactions(logReactor)
        // .addAutoEditors(
        //     async p => {
        //         try {
        //             await p.findFile("thing");
        //             return p;
        //         } catch {
        //             return p.addFile("thing", "1");
        //         }
        //     })
            .addFingerprinters(mavenFingerprinter)
           // .addFingerprintDifferenceHandlers(diff1)
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
            );
    }
}
