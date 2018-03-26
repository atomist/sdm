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

import { FunctionalUnit } from "../../../blueprint/FunctionalUnit";
import { triggerGoal } from "../../../handlers/commands/triggerGoal";
import { ExecuteGoalOnRequested } from "../../../handlers/events/delivery/ExecuteGoalOnRequested";
import { mavenSourceDeployer } from "../../../software-delivery-machine/blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { LocalDeploymentGoal, LocalEndpointGoal } from "../goals/common/commonGoals";
import { DeploySpec, executeDeployArtifact, runWithLog } from "./executeDeploy";
import { TargetInfo } from "../../../spi/deploy/Deployment";
import { Targeter } from "./deploy";
import { ManagedDeploymentTargetInfo } from "./local/appManagement";

function localDeployFromCloneSpec(projectLoader: ProjectLoader, targeter: Targeter<ManagedDeploymentTargetInfo>): DeploySpec<ManagedDeploymentTargetInfo> {
    return {
        implementationName: "localDeploy",
        deployGoal: LocalDeploymentGoal,
        endpointGoal: LocalEndpointGoal,
        deployer: mavenSourceDeployer(projectLoader),
        targeter,
    };
}

export function localDeployment<T extends TargetInfo>(projectLoader: ProjectLoader, targeter: Targeter<ManagedDeploymentTargetInfo>): FunctionalUnit {
    const ld = localDeployFromCloneSpec(projectLoader, targeter);
    return {eventHandlers: [
            () => new ExecuteGoalOnRequested("LocalDeployFromClone",
                LocalDeploymentGoal,
                runWithLog(executeDeployArtifact(ld), ld.deployer.logInterpreter)),
        ],
        commandHandlers: [() => triggerGoal("LocalDeployFromClone", LocalDeploymentGoal)],
    };
}
