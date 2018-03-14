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

import { FunctionalUnit } from "../../../";
import { retryGoal } from "../../../handlers/commands/RetryGoal";
import { deployArtifactWithLogs, executeDeployArtifact, runWithLog } from "../../../handlers/events/delivery/deploy/executeDeploy";
import { EnvironmentCloudFoundryTarget } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { CommandLineCloudFoundryDeployer } from "../../../handlers/events/delivery/deploy/pcf/CommandLineCloudFoundryDeployer";
import { ExecuteGoalOnPendingStatus } from "../../../handlers/events/delivery/ExecuteGoalOnPendingStatus";
import { ExecuteGoalOnSuccessStatus } from "../../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../../handlers/events/delivery/goals/commonGoals";
import { DefaultArtifactStore } from "../artifactStore";

export const Deployer = new CommandLineCloudFoundryDeployer();

/**
 * Deploy everything to the same Cloud Foundry space
 */
const StagingDeploySpec = {
    deployGoal: StagingDeploymentGoal, endpointGoal: StagingEndpointGoal,
    artifactStore: DefaultArtifactStore,
    deployer: Deployer,
    targeter: () => ({
        ...new EnvironmentCloudFoundryTarget(),
        space: "ri-staging",
    }),
};

export const CloudFoundryStagingDeployOnSuccessStatus: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("DeployFromLocal",
            StagingDeploymentGoal,
            deployArtifactWithLogs(StagingDeploySpec)),
        () => new ExecuteGoalOnPendingStatus("DeployFromLocal",
            StagingDeploymentGoal,
            deployArtifactWithLogs(StagingDeploySpec))],
    commandHandlers: [() => retryGoal("DeployFromLocal", ProductionDeploymentGoal)],
};

const ProductionDeploySpec = {
    deployGoal: ProductionDeploymentGoal,
    endpointGoal: ProductionEndpointGoal,
    artifactStore: DefaultArtifactStore,
    deployer: Deployer,
    targeter: () => ({
        ...new EnvironmentCloudFoundryTarget(),
        space: "ri-production",
    }),
};

export const CloudFoundryProductionDeployOnSuccessStatus: FunctionalUnit = {

    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("DeployFromLocal1",
            ProductionDeploymentGoal,
            deployArtifactWithLogs(ProductionDeploySpec)),
        () => new ExecuteGoalOnPendingStatus("DeployFromLocal1",
            ProductionDeploymentGoal,
            deployArtifactWithLogs(ProductionDeploySpec)),
    ],

    commandHandlers: [() => retryGoal("DeployFromLocal1", ProductionDeploymentGoal)],
};
