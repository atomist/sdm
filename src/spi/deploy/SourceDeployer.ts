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
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ManagedDeploymentTargetInfo } from "../../handlers/events/delivery/deploy/local/appManagement";
import { LogInterpreter } from "../log/InterpretedLog";
import { ProgressLog } from "../log/ProgressLog";
import { Deployment } from "./Deployment";

/**
 * Implemented by classes that can deploy from source.
 * Such deployers do not need an artifact to have been built by
 * execution of a previous Build goal.
 */
export interface SourceDeployer {

    /**
     * Undeploy a branch
     */
    undeploy(ti: ManagedDeploymentTargetInfo): Promise<any>;

    deployFromSource(id: RemoteRepoRef,
                     ti: ManagedDeploymentTargetInfo,
                     log: ProgressLog,
                     credentials: ProjectOperationCredentials,
                     atomistTeam: string): Promise<Deployment>;

    logInterpreter?: LogInterpreter;
}
