import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { AbstractSoftwareDeliveryMachine } from "../blueprint/AbstractSoftwareDeliveryMachine";
import { BuildOnScanSuccessStatus } from "../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { ReviewOnPendingScanStatus } from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { ActOnRepoCreation } from "../handlers/events/repo/ActOnRepoCreation";
import { FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OnDeployToProductionFingerprint, OnImageLinked } from "../typings/types";
import { LocalMavenBuildOnSucessStatus } from "./blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import {
    CloudFoundryProductionDeployOnFingerprint,
    CloudFoundryStagingDeployOnImageLinked,
} from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { NotifyOnDeploy } from "./blueprint/deploy/notifyOnDeploy";
import { OfferPromotion, offerPromotionCommand, OfferPromotionParameters } from "./blueprint/deploy/offerPromotion";
import { MyFingerprinter } from "./blueprint/fingerprint/calculateFingerprints";
import { SemanticDiffReactor } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { PhaseCleanup, PhaseSetup } from "./blueprint/phase/phaseManagement";
import { OnNewRepoWithCode } from "./blueprint/repo/onFirstPush";
import { RunReview } from "./blueprint/review/runReview";
import { VerifyEndpoint } from "./blueprint/verify/verifyEndpoint";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

export class MySoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    public onRepoCreation: Maker<ActOnRepoCreation> = ActOnRepoCreation;

    public onNewRepoWithCode: Maker<OnFirstPushToRepo> = OnNewRepoWithCode;

    public fingerprinter: Maker<FingerprintOnPush> = MyFingerprinter;

    public semanticDiffReactor: Maker<ReactToSemanticDiffsOnPushImpact> = SemanticDiffReactor;

    public reviewRunner: Maker<ReviewOnPendingScanStatus> = RunReview;

    public phaseSetup: Maker<SetupPhasesOnPush> = PhaseSetup;

    public builder: Maker<BuildOnScanSuccessStatus> = LocalMavenBuildOnSucessStatus;

    public deploy1: Maker<HandleEvent<OnImageLinked.Subscription>> =
        CloudFoundryStagingDeployOnImageLinked;

    public verifyEndpoint: Maker<VerifyOnEndpointStatus> = VerifyEndpoint;

    public notifyOnDeploy: Maker<OnDeployStatus> = NotifyOnDeploy;

    public onVerifiedStatus: Maker<OnVerifiedStatus> = OfferPromotion;

    public deployToProduction: Maker<HandleCommand> = DeployToProd;

    public offerPromotionCommand: Maker<HandleCommand<OfferPromotionParameters>> = offerPromotionCommand;

    // Todo subscription name is too specific?
    public deploy2: Maker<HandleEvent<OnDeployToProductionFingerprint.Subscription>> =
        CloudFoundryProductionDeployOnFingerprint;

    public generators: Array<Maker<HandleCommand>> = [
        () => springBootGenerator(),
    ];

    public supportingCommands: Array<Maker<HandleCommand>> = [
        () => addCloudFoundryManifest,
        DescribeStagingAndProd,
    ];

    protected possiblePhases: Phases[] = [HttpServicePhases, LibraryPhases];

}
