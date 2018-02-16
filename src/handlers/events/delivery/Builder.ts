import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

/**
 * Responsible for initiating a build
 */
export interface Builder {

    initiateBuild(creds: ProjectOperationCredentials,
                  id: RemoteRepoRef,
                  team: string): Promise<any>;

}
