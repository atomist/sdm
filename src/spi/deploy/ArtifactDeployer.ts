/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { DeployableArtifact } from "../artifact/ArtifactStore";
import { LogInterpretation } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment, TargetInfo } from "./Deployment";

/**
 * Implemented by classes that can deploy from a published artifact that was build
 * by execution of a previous Build goal.
 */
export interface ArtifactDeployer<T extends TargetInfo = TargetInfo, U extends Deployment = Deployment> extends LogInterpretation {

    /**
     * Implemented by deployers that don't sit on an infrastructure like Cloud Foundry
     * or Kubernetes that handles rolling update
     * @return {Promise<any>}
     */
    undeploy?(ti: T, deployment: U, log: ProgressLog): Promise<any>;

    /**
     * Find all deployments of the artifact
     * @param {DeployableArtifact} da
     * @param {T} ti
     * @param {ProjectOperationCredentials} credentials
     * @return {Promise<Array<Promise<Deployment>>>}
     */
    findDeployments?(da: DeployableArtifact,
                     ti: T,
                     creds: ProjectOperationCredentials): Promise<Array<U>>;

    /**
     * Deploy the artifact returning a promise of deployments
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
           team: string): Promise<Array<Promise<U>>>;

}
