import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { BuildOnScanSuccessStatus } from "../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { ScanContext } from "../handlers/events/delivery/phases/core";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { CodeReaction } from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { LookFor200OnEndpointRootGet } from "../handlers/events/delivery/verify/lookFor200OnEndpointRootGet";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { Fingerprinter } from "../handlers/events/repo/FingerprintOnPush";
import { NewRepoWithCodeAction } from "../handlers/events/repo/OnFirstPushToRepo";
import { FingerprintDifferenceHandler } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { AbstractSoftwareDeliveryMachine } from "../sdm/AbstractSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../sdm/DeliveryBlueprint";
import { OnImageLinked } from "../typings/types";
import { LocalMavenBuildOnSucessStatus } from "./blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import {
    CloudFoundryProductionDeployOnFingerprint,
    CloudFoundryStagingDeployOnImageLinked,
} from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { OfferPromotion, offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { mavenFingerprinter } from "./blueprint/fingerprint/mavenFingerprinter";
import { diff1 } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { PhaseSetup } from "./blueprint/phase/phaseManagement";
import { suggestAddingCloudFoundryManifest } from "./blueprint/repo/suggestAddingCloudFoundryManifest";
import { tagRepo } from "./blueprint/repo/tagRepo";
import { logInspect, logReview } from "./blueprint/review/inspect";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";

export class SpringPCFSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    protected scanContext = ScanContext;

    public phaseSetup: Maker<SetupPhasesOnPush> = PhaseSetup;

    public builder: Maker<StatusSuccessHandler> = LocalMavenBuildOnSucessStatus;

    public deploy1: Maker<HandleEvent<OnImageLinked.Subscription>> =
        CloudFoundryStagingDeployOnImageLinked;

    public verifyEndpoint: Maker<VerifyOnEndpointStatus> = LookFor200OnEndpointRootGet;

    public notifyOnDeploy: Maker<OnDeployStatus> = PostToDeploymentsChannel;

    public onVerifiedStatus: Maker<OnVerifiedStatus> = OfferPromotion;

    public promotedEnvironment: PromotedEnvironment = {

        name: "production",

        offerPromotionCommand,

        promote: DeployToProd,

        deploy: CloudFoundryProductionDeployOnFingerprint,
    };

    public generators: Array<Maker<HandleCommand>> = [
        () => springBootGenerator(),
    ];

    public editors: Array<Maker<HandleCommand>> = [];

    public supportingCommands: Array<Maker<HandleCommand>> = [
        () => addCloudFoundryManifest,
        DescribeStagingAndProd,
    ];

    protected get newRepoWithCodeActions(): NewRepoWithCodeAction[] {
        return [tagRepo, suggestAddingCloudFoundryManifest];
    }

    protected get possiblePhases(): Phases[] {
        return [HttpServicePhases, LibraryPhases];
    }

    protected get projectReviewers(): ProjectReviewer[] {
        return [logReview];
    }

    protected get codeInspections(): CodeReaction[] {
        return [logInspect];
    }

    protected get fingerprinters(): Fingerprinter[] {
        return [mavenFingerprinter];
    }

    protected get fingerprintDifferenceHandlers(): FingerprintDifferenceHandler[] {
        return [diff1];
    }

}
