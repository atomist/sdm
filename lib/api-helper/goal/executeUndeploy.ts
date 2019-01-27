/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Success } from "@atomist/automation-client";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { Target } from "../../spi/deploy/Target";

export function executeUndeploy(target: Target): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { id, credentials, goalEvent, progressLog } = goalInvocation;
        const pushBranch = goalEvent.branch;

        const targetInfo = target.targeter(id, pushBranch);
        const deployments = await target.deployer.findDeployments(id, targetInfo, credentials);
        if (!deployments) {
            progressLog.write("No deployments found");
            return Success;
        }

        deployments.forEach(async d =>
            target.deployer.undeploy(
                targetInfo,
                d,
                progressLog,
            ));
        return {code: 0};
    };
}
