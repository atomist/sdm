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
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OfferPromotionParameters } from "../software-delivery-machine/blueprint/deploy/offerPromotion";
import { OnDeployToProductionFingerprint, OnImageLinked, OnPushWithBefore, OnSuccessStatus } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { SetSupersededStatus } from "../handlers/events/delivery/phase/SetSupersededStatus";

/**
 * An environment to promote into. Normally there is only one, for production
 */
export interface PromotedEnvironment {

    name: string;
    deploy: Maker<HandleEvent<OnDeployToProductionFingerprint.Subscription>>;
    promote: Maker<HandleCommand>;
    offerPromotionCommand: Maker<HandleCommand<OfferPromotionParameters>>;

}

/**
 * A reference blueprint for Atomist delivery.
 * Represents a possible delivery process spanning
 * phases of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment
 */
export interface ReferenceDeliveryBlueprint extends FunctionalUnit {

    fingerprinter?: Maker<FingerprintOnPush>;

    semanticDiffReactor?: Maker<ReactToSemanticDiffsOnPushImpact>;

    reviewRunner?: Maker<ReviewOnPendingScanStatus>;

    // TODO need > 1 with different push tests
    phaseSetup: Maker<SetupPhasesOnPush>;

    phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>>;

    /**
     * Do not define if you don't want old commits to be automatically superseded
     */
    oldPushSuperseder?: Maker<SetSupersededStatus>;

    /**
     * Initiate build. We don't need this if there's a CI file in the
     * project itself.
     */
    builder?: Maker<StatusSuccessHandler>;

    onBuildComplete: Maker<SetStatusOnBuildComplete>;

    /**
     * Initial deploy
     */
    deploy1: Maker<HandleEvent<OnImageLinked.Subscription>>;

    notifyOnDeploy?: Maker<OnDeployStatus>;

    verifyEndpoint?: Maker<VerifyOnEndpointStatus>;

    onVerifiedStatus?: Maker<OnVerifiedStatus>;

    // TODO could have n of these?
    promotedEnvironment?: PromotedEnvironment;

    /**
     * Miscellaneous supporting commands needed by the event handlers etc.
     */
    supportingCommands: Array<Maker<HandleCommand>>;

}
