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

import {
    CloudFoundryInfo,
    EnvironmentCloudFoundryTarget,
} from "../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { CommandLineCloudFoundryDeployer } from "../../handlers/events/delivery/deploy/pcf/CommandLineCloudFoundryDeployer";
import { DeployFromLocalOnArtifactStatus } from "../../handlers/events/delivery/DeployFromLocalOnArtifactStatus";
import { StagingDeploymentContext, StagingEndpointContext } from "../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "./artifactStore";

export const Deployer = new CommandLineCloudFoundryDeployer();

/**
 * Deploy everything to the same Cloud Foundry space
 * @type {DeployFromLocalOnArtifactStatus<CloudFoundryInfo>}
 */
export const CloudFoundryStagingDeployOnArtifactStatus =
    new DeployFromLocalOnArtifactStatus(
        StagingDeploymentContext,
        StagingEndpointContext,
        artifactStore,
        Deployer,
        () => ({
            ...new EnvironmentCloudFoundryTarget(),
            space: "ri-staging",
        }),
        );
