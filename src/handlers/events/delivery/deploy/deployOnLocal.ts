/*
 * Copyright © 2017 Atomist, Inc.
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

import { MavenDeployer } from "../../../../software-delivery-machine/blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { LocalDeploymentGoal, LocalEndpointGoal } from "../goals/httpServiceGoals";
import { ExecuteGoalOnPendingStatus } from "../ExecuteGoalOnPendingStatus";
import { executeDeployArtifact, runWithLog } from "./executeDeploy";
import { CloningArtifactStore } from "./local/maven/mavenSourceDeployer";
import { ManagedDeploymentTargeter } from "./local/appManagement";
import { retryGoal } from "../../../commands/RetryGoal";
import { FunctionalUnit } from "../../../../blueprint/FunctionalUnit";

const LocalDeployFromCloneSpec =
    {
        deployGoal: LocalDeploymentGoal,
        endpointGoal: LocalEndpointGoal,
        artifactStore: new CloningArtifactStore(),
        deployer: MavenDeployer,
        targeter: ManagedDeploymentTargeter
    };

export const LocalDeployment: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnPendingStatus("LocalDeployFromClone",
            LocalDeploymentGoal,
            runWithLog(executeDeployArtifact(LocalDeployFromCloneSpec), LocalDeployFromCloneSpec.deployer.logInterpreter)),
    ],
    commandHandlers: [() => retryGoal("LocalDeployFromClone", LocalDeploymentGoal)],
};