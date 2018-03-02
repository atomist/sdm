import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AppInfo } from "../deploy/Deployment";

/**
 * Abstraction for saving and retrieving artifact files from local disk
 */
export interface ArtifactStore {

    /**
     * Store an artifact we have locally at the given absolute path
     * @param {AppInfo} appInfo
     * @param {string} localFile
     * @param creds credentials we can use to talk to source control system
     * @return {Promise<string>} promise of the url at which the
     * StoredArtifact can be retrieved
     */
    storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string>;

    /**
     * Check out the url to a local directory
     * @param {string} url
     * @param {RemoteRepoRef} id
     * @param {ProjectOperationCredentials} creds
     * @return {Promise<DeployableArtifact>}
     */
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
