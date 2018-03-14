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

import { FunctionalUnit } from "../../../../blueprint/FunctionalUnit";
import { MavenDeployer } from "../../../../software-delivery-machine/blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { retryGoal } from "../../../commands/RetryGoal";
import { ExecuteGoalOnPendingStatus } from "../ExecuteGoalOnPendingStatus";
import { LocalDeploymentGoal, LocalEndpointGoal } from "../goals/httpServiceGoals";
import { executeDeploySource, runWithLog, SourceDeploySpec } from "./executeDeploy";

const LocalDeployFromCloneSpec: SourceDeploySpec = {
        deployGoal: LocalDeploymentGoal,
        endpointGoal: LocalEndpointGoal,
        deployer: MavenDeployer,
    };

export const LocalDeployment: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnPendingStatus("LocalDeployFromClone",
            LocalDeploymentGoal,
            runWithLog(executeDeploySource(LocalDeployFromCloneSpec), LocalDeployFromCloneSpec.deployer.logInterpreter)),
    ],
    commandHandlers: [() => retryGoal("LocalDeployFromClone", LocalDeploymentGoal)],
};
