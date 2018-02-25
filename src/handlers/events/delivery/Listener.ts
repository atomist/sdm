import { AddressChannels } from "../../commands/editors/toclient/addressChannels";
import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Common parameters to an invocation of a listener to one of the
 * SDM's specific events
 */
export interface ListenerInvocation<T> {

    id: GitHubRepoRef;

    context: HandlerContext;

    /**
     * Channel link if available
     */
    addressChannels?: AddressChannels;

    credentials: ProjectOperationCredentials;

    data: T;

}

export interface SdmListener<T, R extends any = any> {

    apply(i: ListenerInvocation<T>): Promise<R>;

}
