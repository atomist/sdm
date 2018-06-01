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
     * The repo this command relates to, if it's available
     */
    id?: RemoteRepoRef;

}

export type CommandListener<PARAMS = any> =
    SdmListener<CommandListenerInvocation<PARAMS>>;
