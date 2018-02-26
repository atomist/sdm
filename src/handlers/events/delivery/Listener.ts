import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Function1 } from "lodash";
import { AddressChannels } from "../../commands/editors/toclient/addressChannels";

/**
 * Common parameters to an invocation of a listener to one of the
 * SDM's specific events
 */
export interface ListenerInvocation {

    id: GitHubRepoRef;

    context: HandlerContext;

    /**
     * Channel link if available
     */
    addressChannels?: AddressChannels;

    credentials: ProjectOperationCredentials;

}

export type SdmListener<I extends ListenerInvocation = ListenerInvocation, R extends any = any> =
    Function1<I, Promise<R>>;

export interface ProjectListenerInvocation extends ListenerInvocation {

    project: GitProject;

}

export type ProjectListener = SdmListener<ProjectListenerInvocation>;
