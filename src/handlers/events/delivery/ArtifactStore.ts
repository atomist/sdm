
import * as Stream from "stream";
import { AppInfo } from "./Deployment";

export interface ArtifactStore {

    /**
     * Returns the URL of a StoredArtifact
     * @param {string} appInfo
     * @param {ReadableStream} what
     * @return {Promise<String>}
     */
    store(appInfo: AppInfo, what: Stream): Promise<string>;

    /**
     * Store an artifact we have locally at the given absolute path
     * @param {AppInfo} appInfo
     * @param {string} localFile
     * @return {Promise<string>} promise of the url at which the
     * StoredArtifact can be retrieved
     */
    storeFile(appInfo: AppInfo, localFile: string): Promise<string>;

    retrieve(url: string): Promise<StoredArtifact>;

    checkout(url: string): Promise<DeployableArtifact>;
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
