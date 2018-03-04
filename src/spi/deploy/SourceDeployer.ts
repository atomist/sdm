
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";

/**
 * Implemented by classes that can deploy from source
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(id: RemoteRepoRef, branch: string): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     log: ProgressLog,
                     creds: ProjectOperationCredentials,
                     atomistTeam: string,
                     branch: string): Promise<Deployment>;
}
