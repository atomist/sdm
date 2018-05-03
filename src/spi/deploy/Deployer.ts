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
import { DeployableArtifact } from "../artifact/ArtifactStore";
import { LogInterpretation } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment, TargetInfo } from "./Deployment";

/**
 * Implemented by classes that can deploy from a published artifact that was build
 * by execution of a previous Build goal.
 */
export interface Deployer<T extends TargetInfo = TargetInfo, U extends Deployment = Deployment> extends LogInterpretation {

    /**
     * Remove a deployment. Very useful for project cleanup
     * @return {Promise<any>}
     */
    undeploy(ti: T, deployment: U, log: ProgressLog): Promise<any>;

    /**
     * Find all deployments of the artifact or app
     * @param id of the project
     * @param ti
     * @param credentials
     * @return {Promise<Array<Promise<Deployment>>>}
     */
    findDeployments(id: RemoteRepoRef,
                    ti: T,
                    credentials: ProjectOperationCredentials): Promise<U[]>;

    /**
     * Deploy the app returning a promise of deployments
     * @param {DeployableArtifact} da
     * @param {T} ti
     * @param {ProgressLog} log
     * @param {ProjectOperationCredentials} credentials
     * @param {string} team
     * @return {Promise<Array<Promise<Deployment>>>}
     */
    deploy(da: DeployableArtifact,
           ti: T,
           log: ProgressLog,
           credentials: ProjectOperationCredentials,
           team: string): Promise<U[]>;

}
