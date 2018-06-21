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

import { HandlerContext, logger, Success } from "@atomist/automation-client";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { Goal } from "../../api/goal/Goal";
import { ArtifactStore, DeployableArtifact } from "../../spi/artifact/ArtifactStore";

import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as _ from "lodash";
import { findSdmGoalOnCommit } from "../../api-helper/goal/fetchGoalsOnCommit";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { SdmGoal, SdmGoalState } from "../../api/goal/SdmGoal";
import { Deployment } from "../../spi/deploy/Deployment";
import { Target } from "../../spi/deploy/Target";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { descriptionFromState, updateGoal } from "./storeGoals";

/**
 * Execute deploy with the supplied deployer and target
 */
export function executeDeploy(artifactStore: ArtifactStore,
                              repoRefResolver: RepoRefResolver,
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
            {endpointGoal, rwlc, deployment, repoRefResolver})));

        return Success;
    };
}

export async function checkOutArtifact(targetUrl: string,
                                       artifactStore: ArtifactStore,
                                       id: RemoteRepoRef,
                                       credentials: ProjectOperationCredentials,
                                       progressLog: ProgressLog): Promise<DeployableArtifact> {
    if (!targetUrl) {
        logger.debug("No artifact, must be source-deployed");
        return sourceArtifact(id);
    }
    const artifactCheckout = await artifactStore.checkout(targetUrl, id, credentials)
        .catch(err => {
            progressLog.write("Error checking out artifact: " + err.message);
            throw err;
        });

    if (!artifactCheckout) {
        throw new Error("Error checking out artifact: none found");
    }
    return artifactCheckout;
}

function sourceArtifact(id: RemoteRepoRef): DeployableArtifact {
    return {
        // TODO need to do something about this: Use general identifier as in PCF editor?
        name: id.repo,
        version: "0.1.0",
        id,
    };
}

export async function setEndpointGoalOnSuccessfulDeploy(params: {
    repoRefResolver: RepoRefResolver,
    endpointGoal: Goal,
    rwlc: RunWithLogContext,
    deployment: Deployment,
}) {
    const {rwlc, deployment, endpointGoal} = params;
    const sdmGoal = await findSdmGoalOnCommit(rwlc.context, rwlc.id, params.repoRefResolver.providerIdFromStatus(rwlc.status), endpointGoal);
    // Only update the endpoint goal if it actually exists in the goal set
    if (sdmGoal) {
        if (deployment.endpoint) {
            const newState = "success";
            await markEndpointStatus({context: rwlc.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint});
        } else {
            const error = new Error("Deploy finished with success, but the endpoint was not found");
            const newState = "failure";
            await markEndpointStatus({context: rwlc.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint, error});
        }
    }
}

function markEndpointStatus(parameters: {
    context: HandlerContext, sdmGoal: SdmGoal, endpointGoal: Goal, newState: SdmGoalState, endpoint?: string,
    error?: Error,
}) {
    const {context, sdmGoal, endpointGoal, newState, endpoint, error} = parameters;
    return updateGoal(context, sdmGoal, {
        description: descriptionFromState(endpointGoal, newState),
        url: endpoint,
        state: newState,
        error,
    }).catch(endpointStatus => {
        logger.error("Could not set Endpoint status: " + endpointStatus.message);
        // do not fail this whole handler
    });
}
