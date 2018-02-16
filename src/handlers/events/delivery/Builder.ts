import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

/**
 * Responsible for initiating a build. Wherever the build runs,
 * it is responsible for emitting Atomist build events.
 */
export interface Builder {

    initiateBuild(creds: ProjectOperationCredentials,
                  id: RemoteRepoRef,
                  team: string): Promise<any>;

}
