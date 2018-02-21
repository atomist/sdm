
import * as Stream from "stream";
import { AppInfo } from "./deploy/Deployment";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

export interface ArtifactStore {

    /**
     * Returns the URL of a StoredArtifact
     * @param {string} appInfo
     * @param {ReadableStream} what
     * @return {Promise<String>}
     */
    store(appInfo: AppInfo, what: Stream, creds: ProjectOperationCredentials): Promise<string>;

    /**
     * Store an artifact we have locally at the given absolute path
     * @param {AppInfo} appInfo
     * @param {string} localFile
     * @return {Promise<string>} promise of the url at which the
     * StoredArtifact can be retrieved
     */
    storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string>;

    checkout(url: string, creds: ProjectOperationCredentials): Promise<DeployableArtifact>;
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
