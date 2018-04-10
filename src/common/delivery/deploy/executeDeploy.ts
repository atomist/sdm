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

import { logger, Success } from "@atomist/automation-client";
import { ArtifactStore } from "../../../spi/artifact/ArtifactStore";
import { Goal } from "../goals/Goal";
import { ExecuteGoalResult } from "../goals/goalExecution";
import { checkOutArtifact, setEndpointGoalOnSuccessfulDeploy, Target, Targeter } from "./deploy";

import * as _ from "lodash";
import { Deployer } from "../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../spi/deploy/Deployment";
import { ExecuteGoalWithLog, RunWithLogContext } from "../goals/support/reportGoalError";

export interface DeploySpec<T extends TargetInfo> {
    implementationName: string;
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore?: ArtifactStore;
    deployer: Deployer<T>;
    targeter: Targeter<T>;
    undeploy?: {
        goal: Goal;
        implementationName: string;
    };
    undeployOnSuperseded?: boolean;
}

/**
 * Execute deploy with the supplied deployer and target
 */
export function executeDeploy(artifactStore: ArtifactStore,
                              endpointGoal: Goal,
                              target: Target): ExecuteGoalWithLog {

    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const commit = rwlc.status.commit;
        const {credentials, id, context, progressLog} = rwlc;
        const atomistTeam = context.teamId;

        logger.info("Deploying project %s:%s with target [%j]", id.owner, id.repo, target);

        const artifactCheckout = await checkOutArtifact(_.get(commit, "image.imageName"),
            artifactStore, id, credentials, progressLog);

        // questionable
        artifactCheckout.id.branch = commit.pushes[0].branch;
        const deployments = await target.deployer.deploy(
            artifactCheckout,
            target.targeter(id, id.branch),
            progressLog,
            credentials,
            atomistTeam);

        await Promise.all(deployments.map(deployment => setEndpointGoalOnSuccessfulDeploy(
            {endpointGoal, rwlc, deployment})));

        return Success;
    };
}
