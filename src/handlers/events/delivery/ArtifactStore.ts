import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { AppInfo } from "./deploy/Deployment";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

export interface ArtifactStore {

    /**
     * Store an artifact we have locally at the given absolute path
     * @param {AppInfo} appInfo
     * @param {string} localFile
     * @return {Promise<string>} promise of the url at which the
     * StoredArtifact can be retrieved
     */
    storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string>;

    checkout(url: string, id: RemoteRepoRef, creds: ProjectOperationCredentials): Promise<DeployableArtifact>;
}

export interface StoredArtifact {

    appInfo: AppInfo;

    deploymentUnitUrl: string;
}

/**
 * Checked out artifact
 */
export interface DeployableArtifact extends AppInfo {

    cwd: string;

    filename: string;
}
