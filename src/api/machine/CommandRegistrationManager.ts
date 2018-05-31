import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandHandlerRegistration } from "../registration/CommandHandlerRegistration";
import { EditorRegistration } from "../registration/EditorRegistration";
import { GeneratorRegistration } from "../registration/GeneratorRegistration";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * Manage command registrations using a higher level API
 */
export interface CommandRegistrationManager extends FunctionalUnit {

    /**
     * Add commands to this machine
     * @return {this}
     */
    addCommands(...commands: Array<CommandHandlerRegistration<any>>): this;

    /**
     * Add generators to this machine to enable project creation
     * @return {this}
     */
    addGenerators(...gens: Array<GeneratorRegistration<any>>): this;

    /**
     * Add editors to this machine
     * @return {this}
     */
    addEditors(...eds: EditorRegistration[]): this;

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
