import { OnCommand } from "@atomist/automation-client/onCommand";
import { MachineOrMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Type for registering a project edit, which can encapsulate changes
 * to projects
 */
export interface CommandHandlerRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Create the command function
     * @return {AnyProjectEditor}
     */
    createCommand: (sdm: MachineOrMachineOptions) => OnCommand<PARAMS>;

}
