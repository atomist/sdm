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

import { FunctionalUnit } from "../../../";
import { DeployFromLocalOnSuccessStatus } from "../../../handlers/events/delivery/deploy/DeployFromLocalOnSuccessStatus";
import {
    executeDeploy, ExecuteGoalOnSuccessStatus1,
    retryDeployFromLocal,
} from "../../../handlers/events/delivery/deploy/DeployFromLocalOnSuccessStatus1";
import { EnvironmentCloudFoundryTarget } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { CommandLineCloudFoundryDeployer } from "../../../handlers/events/delivery/deploy/pcf/CommandLineCloudFoundryDeployer";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal, StagingEndpointGoal,

} from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { artifactStore } from "../artifactStore";

export const Deployer = new CommandLineCloudFoundryDeployer();

/**
 * Deploy everything to the same Cloud Foundry space
 */
export const CloudFoundryStagingDeployOnSuccessStatus = () =>
    new DeployFromLocalOnSuccessStatus("RetryDeployFromLocal",
        StagingDeploymentGoal,
        StagingEndpointGoal,
        artifactStore,
        Deployer,
        () => ({
            ...new EnvironmentCloudFoundryTarget(),
            space: "ri-staging",
        }),
    );

export const CloudFoundryProductionDeployOnSuccessStatus: FunctionalUnit = {

    eventHandlers: [() => new ExecuteGoalOnSuccessStatus1("DeployFromLocal1",
        ProductionDeploymentGoal,
        executeDeploy({
            deployGoal: ProductionDeploymentGoal,
            endpointGoal: ProductionEndpointGoal,
            artifactStore,
            deployer: Deployer,
            targeter: () => ({
                ...new EnvironmentCloudFoundryTarget(),
                space: "ri-production",
            }),
        }),
    )],

    commandHandlers: [() => retryDeployFromLocal("DeployFromLocal1",
        {
            deployGoal: ProductionDeploymentGoal,
            endpointGoal: ProductionEndpointGoal,
            artifactStore,
            deployer: Deployer,
            targeter: () => ({
                ...new EnvironmentCloudFoundryTarget(),
                space: "ri-production",
            }),
        })],
};
