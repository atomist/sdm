import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { NewRepoReactor } from "./NewRepoReactor";
import { ReferenceDeliveryBlueprint } from "./ReferenceDeliveryBlueprint";

/**
 * Represents a software delivery machine, which extends delivery blueprint
 * to include project creation etc.
 */
export interface SoftwareDeliveryMachine extends NewRepoReactor, ReferenceDeliveryBlueprint {

    generators: Array<Maker<HandleCommand>>;

    editors: Array<Maker<HandleCommand>>;

}
