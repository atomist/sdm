import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { EventWithCommand } from "../handlers/commands/RetryDeploy";
import { SetStatusOnBuildComplete } from "../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { FailDownstreamPhasesOnPhaseFailure } from "../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { SetSupersededStatus } from "../handlers/events/delivery/phase/SetSupersededStatus";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { OnPendingScanStatus } from "../handlers/events/delivery/review/OnPendingScanStatus";
import { OnEndpointStatus } from "../handlers/events/delivery/verify/OnEndpointStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { StatusSuccessHandler } from "../handlers/events/StatusSuccessHandler";
import { OfferPromotionParameters } from "../software-delivery-machine/blueprint/deploy/offerPromotion";
import { OnDeployToProductionFingerprint, OnImageLinked, OnSuccessStatus, OnSupersededStatus } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";

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

    reviewRunner?: Maker<OnPendingScanStatus>;

    phaseSetup: Maker<SetupPhasesOnPush>;

    phaseCleanup: Array<Maker<FailDownstreamPhasesOnPhaseFailure>>;

    /**
     * Do not define if you don't want old commits to be automatically superseded
     */
    oldPushSuperseder?: Maker<SetSupersededStatus>;

    /**
     * React when a push is superseded
     */
    onSuperseded?: Maker<HandleEvent<OnSupersededStatus.Subscription>>;

    /**
     * Initiate build. We don't need this if there's a CI file in the
     * project itself.
     */
    builder?: Maker<StatusSuccessHandler>;

    onBuildComplete: Maker<SetStatusOnBuildComplete>;

    artifactFinder: Maker<HandleEvent<OnImageLinked.Subscription>>;

    /**
     * Initial deploy
     */
    deploy1: Maker<HandleEvent<OnSuccessStatus.Subscription & EventWithCommand>>;

    notifyOnDeploy?: Maker<OnDeployStatus>;

    verifyEndpoint?: Maker<OnEndpointStatus>;

    onVerifiedStatus?: Maker<OnVerifiedStatus>;

    // TODO could have n of these?
    promotedEnvironment?: PromotedEnvironment;

    /**
     * Miscellaneous supporting commands needed by the event handlers etc.
     */
    supportingCommands: Array<Maker<HandleCommand>>;

}
