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

import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import { DeployableArtifact } from "../../../spi/artifact/ArtifactStore";
import { TargetInfo } from "../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { GoalExecutor } from "../goals/goalExecution";
import { ExecuteWithLog, runWithLog, RunWithLogContext } from "../goals/support/runWithLog";
import { DeploySpec } from "./executeDeploy";

export function executeUndeploy<T extends TargetInfo>(spec: DeploySpec<T>): ExecuteWithLog {
    return async (rwlc: RunWithLogContext) => {
        const {id, credentials, status, progressLog} = rwlc;
        const commit = status.commit;
        const pushBranch = commit.pushes[0].branch;
        progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);

        if (!spec.deployer.findDeployments || !spec.deployer.undeploy) {
            throw new Error("Deployer does not implement findDeployments and undeploy");
        }

        const targetInfo = spec.targeter(id, pushBranch);
        const deployments = await spec.deployer.findDeployments(id, targetInfo, credentials);

        logger.info("Detected deployments: %s", deployments.map(d => stringify(d)).join(", "));

        deployments.forEach(async d =>
            spec.deployer.undeploy(
                targetInfo,
                d,
                progressLog,
            ));
        return {code: 0};
    };
}
