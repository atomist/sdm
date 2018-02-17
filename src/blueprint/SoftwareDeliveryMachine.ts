import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { Blueprint } from "./Blueprint";

/**
 * Represents a software delivery machine, which extends delivery blueprint
 * to include project creation etc.
 */
export interface SoftwareDeliveryMachine extends Blueprint {

    generators: Array<Maker<HandleCommand>>;

}
