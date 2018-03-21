
import { HandlerContext } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

/**
 * Common interface for project loading that allows caching etc.
 */
export interface ProjectLoader {

    /**
     * Load a GitProject, regardless of source
     * @param {ProjectOperationCredentials} credentials
     * @param {RemoteRepoRef} r
     * @param {HandlerContext} context
     * @return {Promise<GitProject>}
     */
    load(credentials: ProjectOperationCredentials, r: RemoteRepoRef, context?: HandlerContext): Promise<GitProject>;
}
