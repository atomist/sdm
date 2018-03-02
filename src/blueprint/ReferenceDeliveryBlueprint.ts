import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { PromotionParameters } from "../software-delivery-machine/blueprint/deploy/presentPromotionInformation";
import { OnDeployToProductionFingerprint } from "../typings/types";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * A reference blueprint for Atomist delivery.
 * Represents a possible delivery process spanning
 * phases of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment
 */
export interface ReferenceDeliveryBlueprint extends FunctionalUnit {

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
