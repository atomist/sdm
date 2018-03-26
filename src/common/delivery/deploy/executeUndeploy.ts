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
import { DeploySpec, ExecuteWithLog, runWithLog, RunWithLogContext } from "./executeDeploy";

export function undeployArtifactWithLogs<T extends TargetInfo>(spec: DeploySpec<T>): GoalExecutor {
    return runWithLog(executeUndeployArtifact(spec), spec.deployer.logInterpreter);
}

export function executeUndeployArtifact<T extends TargetInfo>(spec: DeploySpec<T>): ExecuteWithLog {
    return async (rwlc: RunWithLogContext) => {
        const commit = rwlc.status.commit;
        const image = rwlc.status.commit.image;
        const pushBranch = commit.pushes[0].branch;
        rwlc.progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);

        if (!spec.deployer.findDeployments || !spec.deployer.undeploy) {
            throw new Error("Deployer does not implement findDeployments and undeploy");
        }
        const progressLog = rwlc.progressLog;

        // some undeploy processes do not really need the artifact, so don't fail
        let artifactCheckout: DeployableArtifact;
        if (image) {
            const targetUrl = image.imageName;
            artifactCheckout = await spec.artifactStore.checkout(targetUrl, rwlc.id,
                rwlc.credentials).then(rejectUndefined).catch(writeError(progressLog));
        }

        const targetInfo = spec.targeter(rwlc.id, pushBranch);
        const deployments = await spec.deployer.findDeployments(artifactCheckout, targetInfo, rwlc.credentials);

        logger.info("Detected deployments: %s", deployments.map(d => stringify(d)).join(", "));

        await deployments.forEach(async d =>
            await spec.deployer.undeploy(
                targetInfo,
                d,
                progressLog,
            ));

        return {code: 0};
    };
}

function writeError(progressLog: ProgressLog) {
    return (err: Error) => {
        progressLog.write("Error checking out artifact: " + err.message);
        throw err;
    };
}

function rejectUndefined<T>(thing: T): T {
    if (!thing) {
        throw new Error("No DeployableArtifact found");
    }
    return thing;
}
