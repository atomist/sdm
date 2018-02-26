import { HandleEvent, logger } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/BuildCompleteOnImageLinked";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { ArtifactContext, ScanContext } from "../handlers/events/delivery/phases/gitHubContext";
import { ContextToPlannedPhase, HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { checkstyleReviewer } from "../handlers/events/delivery/review/checkstyle/checkstyleReviewer";
import { tagRepo } from "../handlers/events/repo/tagRepo";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { AbstractSoftwareDeliveryMachine } from "../sdm-support/AbstractSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm-support/ReferenceDeliveryBlueprint";
import { OnAnySuccessStatus } from "../typings/types";
import { K8sBuildOnSuccessStatus } from "./blueprint/build/K8sBuildOnScanSuccess";
import { CloudFoundryProductionDeployOnFingerprint } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { K8sStagingDeployOnSuccessStatus, NoticeK8sDeployCompletion } from "./blueprint/deploy/k8sDeploy";
import { LocalMavenDeployOnImageLinked } from "./blueprint/deploy/mavenDeploy";
import { offerPromotionCommand, presentPromotionButton } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { mavenFingerprinter } from "./blueprint/fingerprint/maven/mavenFingerprinter";
import { PhaseSetup } from "./blueprint/phase/phaseManagement";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { logReactor, logReview } from "./blueprint/review/scan";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/common/lookFor200OnEndpointRootGet";

const LocalMavenDeployer = LocalMavenDeployOnImageLinked;

// CloudFoundryStagingDeployOnImageLinked

// TODO capture commonality with Spring PCF machine. Not much is unique to deployment.
export class SpringK8sSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    protected scanContext = ScanContext;

    public phaseSetup: Maker<SetupPhasesOnPush> = PhaseSetup;

    public builder: Maker<StatusSuccessHandler> = K8sBuildOnSuccessStatus;

    public artifactFinder = () => new FindArtifactOnImageLinked(ContextToPlannedPhase[ArtifactContext]);

    public deploy1: Maker<HandleEvent<OnAnySuccessStatus.Subscription>> =
        K8sStagingDeployOnSuccessStatus;

    public promotedEnvironment: PromotedEnvironment = {

        name: "production",

        offerPromotionCommand,

        promote: DeployToProd,

        deploy: CloudFoundryProductionDeployOnFingerprint,
    };

    get possiblePhases(): Phases[] {
        return [HttpServicePhases, LibraryPhases];
    }

    constructor() {
        super();
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
