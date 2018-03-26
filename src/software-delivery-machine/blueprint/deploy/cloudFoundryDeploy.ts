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

import {
    CloudFoundryInfo,
    EnvironmentCloudFoundryTarget,
} from "../../../common/delivery/deploy/pcf/CloudFoundryTarget";
import { CommandLineCloudFoundryDeployer } from "../../../common/delivery/deploy/pcf/CommandLineCloudFoundryDeployer";
import { DeploySpec } from "../../../common/delivery/deploy/runWithLog";
import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../../common/delivery/goals/common/commonGoals";
import { CodeReactionListener } from "../../../common/listener/CodeReactionListener";
import { setDeployEnablement } from "../../../handlers/commands/SetDeployEnablement";
import { AddCloudFoundryManifestMarker } from "../../commands/editors/pcf/addCloudFoundryManifest";
import { DefaultArtifactStore } from "../artifactStore";

/**
 * Deploy everything to the same Cloud Foundry space
 */
export const CloudFoundryStagingDeploySpec: DeploySpec<CloudFoundryInfo> = {
    implementationName: "DeployFromLocalToStaging",
    deployGoal: StagingDeploymentGoal,
    endpointGoal: StagingEndpointGoal,
    artifactStore: DefaultArtifactStore,
    deployer: new CommandLineCloudFoundryDeployer(),
    targeter: () => ({
        ...new EnvironmentCloudFoundryTarget(),
        space: "ri-staging",
    }),
};

export const CloudFoundryProductionDeploySpec: DeploySpec<CloudFoundryInfo> = {
    implementationName: "DeployFromLocalToProd",
    deployGoal: ProductionDeploymentGoal,
    endpointGoal: ProductionEndpointGoal,
    artifactStore: DefaultArtifactStore,
    deployer: new CommandLineCloudFoundryDeployer(),
    targeter: () => ({
        ...new EnvironmentCloudFoundryTarget(),
        space: "ri-production",
    }),
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
