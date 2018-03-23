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

import { composeFunctionalUnits } from "../../../blueprint/ComposedFunctionalUnit";
import { EmptyFunctionalUnit, FunctionalUnit } from "../../../blueprint/FunctionalUnit";
import { ArtifactDeploySpec, deployArtifactWithLogs } from "../../../common/delivery/deploy/executeDeploy";
import { undeployArtifactWithLogs } from "../../../common/delivery/deploy/executeUndeploy";
import { triggerGoal } from "../../../handlers/commands/triggerGoal";
import { ExecuteGoalOnRequested } from "../../../handlers/events/delivery/ExecuteGoalOnRequested";
import { ExecuteGoalOnSuccessStatus } from "../../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { TargetInfo } from "../../../spi/deploy/Deployment";

export function deployArtifactGoalHandlers<T extends TargetInfo>(spec: ArtifactDeploySpec<T>): FunctionalUnit {
    const deployHandlers = {
        eventHandlers: [
            () => new ExecuteGoalOnSuccessStatus(spec.implementationName,
                spec.deployGoal,
                deployArtifactWithLogs(spec)),
            () => new ExecuteGoalOnRequested(spec.implementationName,
                spec.deployGoal,
                deployArtifactWithLogs(spec)),
        ],
        commandHandlers: [
            () => triggerGoal(spec.implementationName, spec.deployGoal),
        ],
    };

    const undeployHandlers = spec.undeploy ? {
        eventHandlers: [
            () => new ExecuteGoalOnRequested(spec.undeploy.implementationName,
                spec.undeploy.goal,
                undeployArtifactWithLogs(spec), true),
        ],
        commandHandlers: [
            () => triggerGoal(spec.undeploy.implementationName, spec.undeploy.goal),
        ],
    } : EmptyFunctionalUnit;

    return composeFunctionalUnits(deployHandlers, undeployHandlers);
}
