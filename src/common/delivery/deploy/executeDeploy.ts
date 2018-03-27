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
import { ProjectListenerInvocation } from "../../listener/Listener";
import { PushMapping } from "../../listener/PushMapping";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { Goal } from "../goals/Goal";
import { ExecuteGoalResult, GoalExecutor } from "../goals/goalExecution";
import { checkOutArtifact, setEndpointStatusOnSuccessfulDeploy, Target, Targeter } from "./deploy";

import * as _ from "lodash";
import { Deployer } from "../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../spi/deploy/Deployment";
import { lastTenLinesLogInterpreter, runWithLog, RunWithLogContext } from "./runWithLog";

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
 * Execute deploy with the appropriate deployer and target from the underlying push
 * @param projectLoader used to load projects
 * @param targetMapping mapping to a target
 */
export function executeDeploy(artifactStore: ArtifactStore,
                              projectLoader: ProjectLoader,
                              deployGoal: Goal,
                              endpointGoal: Goal,
                              targetMapping: PushMapping<Target<any>>): GoalExecutor {

    return runWithLog(async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const commit = rwlc.status.commit;
        const { addressChannels, credentials, id, context, progressLog}  = rwlc;
        const atomistTeam = context.teamId;

        await projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
                const push = commit.pushes[0];
                const pti: ProjectListenerInvocation = {
                    id,
                    project,
                    credentials,
                    context,
                    addressChannels,
                    push,
                };

                const target = await targetMapping.valueForPush(pti);
                if (!target) {
                    throw new Error(`Don't know how to deploy project ${id.owner}:${id.repo}`);
                }
                logger.info("Deploying project %s:%s with target [%j]", id.owner, id.repo, target);

                const artifactCheckout = await checkOutArtifact(_.get(commit, "image.imageName"),
                    artifactStore, id, credentials, progressLog);

                const deployments = await target.deployer.deploy(
                    artifactCheckout,
                    target.targeter(id, id.branch),
                    progressLog,
                    credentials,
                    atomistTeam);

                return Promise.all(deployments.map(deployment => setEndpointStatusOnSuccessfulDeploy(
                    {endpointGoal, credentials, id}, deployment)));

            });
        return Success;
    }, lastTenLinesLogInterpreter("deploy failed"));
}
