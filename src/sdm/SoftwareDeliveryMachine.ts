import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { DeliveryBlueprint } from "./DeliveryBlueprint";
import { NewRepoReactor } from "./NewRepoReactor";

/**
 * Represents a software delivery machine, which extends delivery blueprint
 * to include project creation etc.
 */
export interface SoftwareDeliveryMachine extends NewRepoReactor, DeliveryBlueprint {

    generators: Array<Maker<HandleCommand>>;

    editors: Array<Maker<HandleCommand>>;

}
