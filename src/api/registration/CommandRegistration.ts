import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

/**
 * Type for registering a project edit, which can encapsulate changes
 * to projects
 */
export interface CommandRegistration<PARAMS> extends Partial<CommandDetails> {

    name: string;

    /**
     * Create the parameters required by this command.
     * Empty parameters will be returned by default.
     */
    paramsMaker?: Maker<PARAMS>;

}
