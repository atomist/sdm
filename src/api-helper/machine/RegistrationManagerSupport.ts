import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandRegistrationManager } from "../../api/machine/CommandRegistrationManager";
import { HandlerRegistrationManager } from "../../api/machine/HandlerRegistrationManager";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { commandHandlerRegistrationToCommand, editorRegistrationToCommand, generatorRegistrationToCommand } from "./commandRegistrations";
import { MachineOrMachineOptions } from "./toMachineOptions";

/**
 * Concrete implementation of CommandRegistrationManager and
 * HandlerRegistrationManager
 */
export class RegistrationManagerSupport implements CommandRegistrationManager, HandlerRegistrationManager {

    constructor(private readonly sdm: MachineOrMachineOptions) {
    }

    public commandHandlers: Array<Maker<HandleCommand>> = [];

    public eventHandlers: Array<Maker<HandleEvent<any>>> = [];

    public addCommands(...cmds: Array<CommandHandlerRegistration<any>>): this {
        const commands = cmds.map(c => commandHandlerRegistrationToCommand(this.sdm, c));
        this.commandHandlers = this.commandHandlers.concat(commands);
        return this;
    }

    public addGenerators(...gens: Array<GeneratorRegistration<any>>): this {
        const commands = gens.map(g => generatorRegistrationToCommand(this.sdm, g));
        this.commandHandlers = this.commandHandlers.concat(commands);
        return this;
    }

    public addEditors(...eds: EditorRegistration[]): this {
        const commands = eds.map(e => editorRegistrationToCommand(this.sdm, e));
        this.commandHandlers = this.commandHandlers.concat(commands);
        return this;
    }

    public addSupportingCommands(...e: Array<Maker<HandleCommand>>): this {
        this.commandHandlers.push(...e);
        return this;
    }

    public addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this {
        this.eventHandlers.push(...e);
        return this;
    }

}
