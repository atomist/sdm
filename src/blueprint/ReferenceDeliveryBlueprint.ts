import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { OfferPromotionParameters } from "../software-delivery-machine/blueprint/deploy/offerPromotion";
import { OnDeployToProductionFingerprint } from "../typings/types";
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

    // TODO could have n of these?
    promotedEnvironment?: PromotedEnvironment;

    /**
     * Miscellaneous supporting commands needed by the event handlers etc.
     */
    supportingCommands: Array<Maker<HandleCommand>>;

    supportingEvents: Array<Maker<HandleEvent<any>>>;

    /**
     * FunctionalUnits brought in by this project
     */
    functionalUnits: FunctionalUnit[];

}
