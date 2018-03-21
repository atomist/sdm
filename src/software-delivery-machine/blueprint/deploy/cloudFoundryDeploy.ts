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

import {FunctionalUnit} from "../../../blueprint/FunctionalUnit";
import {deployArtifactWithLogs} from "../../../common/delivery/deploy/executeDeploy";
import {EnvironmentCloudFoundryTarget} from "../../../common/delivery/deploy/pcf/CloudFoundryTarget";
import {CommandLineCloudFoundryDeployer} from "../../../common/delivery/deploy/pcf/CommandLineCloudFoundryDeployer";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../../common/delivery/goals/common/commonGoals";
import { CodeReactionListener } from "../../../common/listener/CodeReactionListener";
import {retryGoal} from "../../../handlers/commands/RetryGoal";
import { setDeployEnablement } from "../../../handlers/commands/SetDeployEnablement";
import {ExecuteGoalOnPendingStatus} from "../../../handlers/events/delivery/ExecuteGoalOnPendingStatus";
import {ExecuteGoalOnSuccessStatus} from "../../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { AddCloudFoundryManifestMarker } from "../../commands/editors/pcf/addCloudFoundryManifest";
import {DefaultArtifactStore} from "../artifactStore";

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

export const CloudFoundryStagingDeploy: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("DeployFromLocalToStaging",
            StagingDeploymentGoal,
            deployArtifactWithLogs(StagingDeploySpec)),
        () => new ExecuteGoalOnPendingStatus("DeployFromLocalToStaging",
            StagingDeploymentGoal,
            deployArtifactWithLogs(StagingDeploySpec))],
    commandHandlers: [() => retryGoal("DeployFromLocalToStaging", ProductionDeploymentGoal)],
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

export const CloudFoundryProductionDeploy: FunctionalUnit = {

    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("DeployFromLocalToProd",
            ProductionDeploymentGoal,
            deployArtifactWithLogs(ProductionDeploySpec)),
        () => new ExecuteGoalOnPendingStatus("DeployFromLocalToProd",
            ProductionDeploymentGoal,
            deployArtifactWithLogs(ProductionDeploySpec)),
    ],

    commandHandlers: [() => retryGoal("DeployFromLocalToProd", ProductionDeploymentGoal)],
};

/**
 * Enable deployment when a PCF manifest is added to the default branch.
 */
export const EnableDeployOnCloudFoundryManifestAddition: CodeReactionListener = async cri => {
    const commit = cri.commit;
    const repo = commit.repo;
    const push = commit.pushes[0];

    if (push.commits.some(c => c.message.includes(AddCloudFoundryManifestMarker))) {
        await setDeployEnablement(true)
            (cri.context, { repo: repo.name, owner: repo.owner, providerId: repo.org.provider.providerId });
    }
};
