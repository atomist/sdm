import { HandlerContext } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

export type WithLoadedProject<T = any> = (p: GitProject) => Promise<T>;

export interface ProjectLoadingParameters {

    credentials: ProjectOperationCredentials;
    id: RemoteRepoRef;
    context?: HandlerContext;

    /** Return true to get optimized behavior for read only */
    readOnly: boolean;
}

/**
 * Common interface for project loading that allows caching etc.
 */
export interface ProjectLoader {

    /**
     * Perform an action with the given project
     * @param {ProjectLoadingParameters} params
     * @param {WithLoadedProject<T>} action
     */
    doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T>;

}
