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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Goal } from "../../api/goal/Goal";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T;

export interface DeployStage {
    deployGoal: Goal;
    endpointGoal: Goal;
    undeployGoal: Goal;
}

export interface DeployerInfo<T extends TargetInfo> {
    deployer: Deployer<T>;
    targeter: Targeter<T>;
}

export interface Target<T extends TargetInfo = TargetInfo> extends DeployerInfo<T>, DeployStage {
}
