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

import { DeployFromLocalOnSuccessStatus } from "../../../handlers/events/delivery/deploy/DeployFromLocalOnSuccessStatus";
import { TargetInfo } from "../../../handlers/events/delivery/deploy/Deployment";
import { executableJarDeployer } from "../../../handlers/events/delivery/deploy/local/jar/executableJarDeployer";
import {
    ContextToPlannedPhase,
    HttpServicePhases,
    StagingDeploymentContext,
    StagingEndpointContext,
} from "../../../handlers/events/delivery/phases/httpServicePhases";
import { artifactStore } from "../artifactStore";

/**
 * Deploy to the automation client node
 */
export const LocalDeployOnAutomationNodeDeployOnSuccessStatus: DeployFromLocalOnSuccessStatus<TargetInfo> =
    new DeployFromLocalOnSuccessStatus<TargetInfo>(
        HttpServicePhases,
        ContextToPlannedPhase[StagingDeploymentContext],
        ContextToPlannedPhase[StagingEndpointContext],
        artifactStore,
        executableJarDeployer({
            baseUrl: "http://localhost",
            lowerPort: 8080,
        }),
        () => ({
            name: "Local",
            description: "Deployment alongside local automation client",
        }),
    );
