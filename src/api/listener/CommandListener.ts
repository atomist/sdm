import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SdmContext } from "../context/SdmContext";
import { SdmListener } from "./Listener";

/**
 * Context for a commmand
 */
export interface CommandListenerInvocation<PARAMS = any> extends SdmContext {

    commandName: string;

    /**
     * Parameters, if any were supplied
     */
    parameters?: PARAMS;

    /**
     * The repos this command relates to, if available.
     */
    ids?: RemoteRepoRef[];

}

export type CommandListener<PARAMS = any> =
    SdmListener<CommandListenerInvocation<PARAMS>>;
