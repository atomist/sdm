import { HandleCommand } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { MachineOrMachineOptions } from "../machine/support/toMachineOptions";

/**
 * Factory for command Makers
 */
export type SdmCommandMakerFactory = (mo: MachineOrMachineOptions) => Maker<HandleCommand>;
