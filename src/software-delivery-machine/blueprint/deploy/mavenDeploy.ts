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

import { DeployFromLocalOnImageLinked } from "../../../handlers/events/delivery/deploy/DeployFromLocalOnImageLinked";
import { CloudFoundryInfo, } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import {
    CloudFoundryStagingDeploymentContext,
    ContextToPlannedPhase,
    HttpServicePhases,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";
import { MavenDeployer } from "../../../handlers/events/delivery/deploy/local/maven/MavenDeployer";
import { TargetInfo } from "../../../handlers/events/delivery/deploy/Deployment";

/**
 * Deploy everything to the same Cloud Foundry space
 * @type {DeployFromLocalOnImageLinked<CloudFoundryInfo>}
 */
export const LocalMavenDeployOnImageLinked: () => DeployFromLocalOnImageLinked<TargetInfo> = () =>
    new DeployFromLocalOnImageLinked(
        HttpServicePhases,
        ContextToPlannedPhase[CloudFoundryStagingDeploymentContext],
        ContextToPlannedPhase[StagingEndpointContext],
        artifactStore,
        MavenDeployer,
        () => ({
            name: "Local",
            description: "Deployment alongside local automation client",
        }),
    );
