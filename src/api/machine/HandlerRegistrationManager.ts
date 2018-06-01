import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * Manage command registrations using a higher level API
 */
export interface HandlerRegistrationManager extends FunctionalUnit {

    /**
     * Add supporting commands for other functionality. Consider using
     * addExtensionPacks to group functionality
     * @param {Maker<HandleCommand>} e
     * @return {this}
     */
    addSupportingCommands(...e: Array<Maker<HandleCommand>>): this;

    /**
     * Add supporting events for other functionality. Consider using
     * addExtensionPacks to group functionality
     * @param {Maker<HandleCommand>} e
     * @return {this}
     */
    addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this;
}
