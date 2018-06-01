import { CommandHandlerRegistration } from "../registration/CommandHandlerRegistration";
import { EditorRegistration } from "../registration/EditorRegistration";
import { GeneratorRegistration } from "../registration/GeneratorRegistration";

/**
 * Manage command registrations using a higher level API
 */
export interface CommandRegistrationManager {

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

}
