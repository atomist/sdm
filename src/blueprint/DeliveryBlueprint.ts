import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { ReviewOnPendingScanStatus } from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OfferPromotionParameters } from "../software-delivery-machine/blueprint/deploy/offerPromotion";
import { OnDeployToProductionFingerprint, OnImageLinked, OnRepoCreation, OnSuccessStatus } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * A Blueprint represents the delivery process
 */
export interface DeliveryBlueprint extends FunctionalUnit {

    onRepoCreation?: Maker<HandleEvent<OnRepoCreation.Subscription>>;

    onNewRepoWithCode: Maker<OnFirstPushToRepo>;

    fingerprinter?: Maker<FingerprintOnPush>;

    semanticDiffReactor?: Maker<ReactToSemanticDiffsOnPushImpact>;

    reviewRunner?: Maker<ReviewOnPendingScanStatus>;

    phaseSetup: Maker<SetupPhasesOnPush>;

    phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>>;

    // TODO can we have multiple
    builder: Maker<HandleEvent<OnSuccessStatus.Subscription>>;

    onBuildComplete: Maker<SetStatusOnBuildComplete>;

    deploy1: Maker<HandleEvent<OnImageLinked.Subscription>>;

    notifyOnDeploy?: Maker<OnDeployStatus>;

    verifyEndpoint?: Maker<VerifyOnEndpointStatus>;

    onVerifiedStatus?: Maker<OnVerifiedStatus>;

    // TODO these 3 should go together in an optional
    // TODO could have n of these?
    deploy2: Maker<HandleEvent<OnDeployToProductionFingerprint.Subscription>>;
    deployToProduction?: Maker<HandleCommand>;
    offerPromotionCommand?: Maker<HandleCommand<OfferPromotionParameters>>;

    /**
     * Miscellaneous supporting commands
     */
    supportingCommands: Array<Maker<HandleCommand>>;

}
