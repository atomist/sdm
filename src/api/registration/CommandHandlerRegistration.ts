import { OnCommand } from "@atomist/automation-client/onCommand";
import { MachineOrMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { CommandListener } from "../listener/CommandListener";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Type for registering a project edit, which can encapsulate changes
 * to projects. One of listener or createCommand function must be provided.
 */
export interface CommandHandlerRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Create the command function
     * @return {AnyProjectEditor}
     */
    createCommand?: (sdm: MachineOrMachineOptions) => OnCommand<PARAMS>;

    listener?: CommandListener<PARAMS>;

}
