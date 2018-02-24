import { HandleEvent, logger } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { FindArtifactOnImageLinked } from "../handlers/events/delivery/build/BuildCompleteOnImageLinked";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { ArtifactContext, ScanContext } from "../handlers/events/delivery/phases/gitHubContext";
import { ContextToPlannedPhase, HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { checkstyleReviewer } from "../handlers/events/delivery/review/checkstyleReviewer";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/lookFor200OnEndpointRootGet";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { tagRepo } from "../handlers/events/repo/tagRepo";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { AbstractSoftwareDeliveryMachine } from "../sdm-support/AbstractSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm-support/ReferenceDeliveryBlueprint";
import { OnAnySuccessStatus } from "../typings/types";
import { LocalMavenBuildOnSuccessStatus } from "./blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import { CloudFoundryProductionDeployOnFingerprint, } from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { LocalMavenDeployOnImageLinked } from "./blueprint/deploy/mavenDeploy";
import { OfferPromotion, offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { diff1 } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { PhaseSetup } from "./blueprint/phase/phaseManagement";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { logReactor, logReview } from "./blueprint/review/scan";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";
import { mavenFingerprinter } from "./blueprint/fingerprint/maven/mavenFingerprinter";
import { publishNewRepo } from "./blueprint/repo/publishNewRepo";
import { EventWithCommand } from "../handlers/commands/RetryDeploy";
import { requestDescription } from "./blueprint/issue/requestDescription";

const LocalMavenDeployer = LocalMavenDeployOnImageLinked;

export class SpringPCFSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    protected scanContext = ScanContext;

    public phaseSetup: Maker<SetupPhasesOnPush> = PhaseSetup;

    public builder: Maker<StatusSuccessHandler> = LocalMavenBuildOnSuccessStatus;

    public artifactFinder = () => new FindArtifactOnImageLinked(ContextToPlannedPhase[ArtifactContext]);

    public deploy1: Maker<HandleEvent<OnAnySuccessStatus.Subscription> & EventWithCommand> =
        // CloudFoundryStagingDeployOnSuccessStatus;
        () => LocalMavenDeployer;

    public verifyEndpoint: Maker<VerifyOnEndpointStatus> = LookFor200OnEndpointRootGet;

    public onVerifiedStatus: Maker<OnVerifiedStatus> = OfferPromotion;

    public promotedEnvironment: PromotedEnvironment = {

        name: "production",

        offerPromotionCommand,

        promote: DeployToProd,

        deploy: CloudFoundryProductionDeployOnFingerprint,
    };

    get possiblePhases(): Phases[] {
        return [HttpServicePhases, LibraryPhases];
    }

    constructor(opts: { useCheckstyle: boolean }) {
        super();

        this.addNewIssueListeners(requestDescription);

        this.addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
            groupId: "myco",
        }))
            .addNewRepoWithCodeActions(
                tagRepo(springBootTagger),
                suggestAddingCloudFoundryManifest,
                publishNewRepo)
            .addProjectReviewers(logReview);
        if (opts.useCheckstyle) {
            const checkStylePath = process.env.CHECKSTYLE_PATH;
            if (!!checkStylePath) {
                this.addProjectReviewers(checkstyleReviewer(checkStylePath));
            } else {
                logger.warn("Skipping Checkstyle; to enable it, set CHECKSTYLE_PATH env variable to the location of a downloaded checkstyle jar");
            }
        }
        this.addCodeReactions(logReactor)
            .addFingerprinters(mavenFingerprinter)
            .addFingerprintDifferenceHandlers(diff1)
            .addDeploymentListeners(PostToDeploymentsChannel)
            .addSupersededListeners(
                id => {
                    logger.info("Will undeploy application %j", id);
                    return LocalMavenDeployer.deployer.undeploy(id);
                })
            .addSupportingCommands(
                () => addCloudFoundryManifest,
                DescribeStagingAndProd,
            );
    }
}
