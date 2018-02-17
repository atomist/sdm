import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { DeliveryBlueprint } from "./DeliveryBlueprint";

/**
 * Represents a software delivery machine, which extends delivery blueprint
 * to include project creation etc.
 */
export interface SoftwareDeliveryMachine extends DeliveryBlueprint {

    generators: Array<Maker<HandleCommand>>;

}
