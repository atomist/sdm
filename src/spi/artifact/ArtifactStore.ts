/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AppInfo } from "../deploy/Deployment";

/**
 * Abstraction for saving and retrieving artifact files
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

/**
 * Information about a stored artifact.
 */
export interface StoredArtifact {

    appInfo: AppInfo;

    deploymentUnitUrl: string;
}

/**
 * Checked out artifact available on local file system
 */
export interface DeployableArtifact extends AppInfo {

    cwd?: string;

    filename?: string;
}
