/*
 * Copyright © 2019 Atomist, Inc.
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

import {
    HandlerContext,
    logger,
    ProjectOperationCredentials,
    RemoteRepoRef,
    Success,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { findSdmGoalOnCommit } from "../../api-helper/goal/fetchGoalsOnCommit";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { Goal } from "../../api/goal/Goal";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import {
    ArtifactStore,
    DeployableArtifact,
} from "../../spi/artifact/ArtifactStore";
import { Deployment } from "../../spi/deploy/Deployment";
import { Target } from "../../spi/deploy/Target";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { SdmGoalState } from "../../typings/types";
import {
    descriptionFromState,
    updateGoal,
} from "./storeGoals";

/**
 * @deprecated Deployer concept will be removed.
 * Execute deploy with the supplied deployer and target
 */
export function executeDeploy(artifactStore: ArtifactStore,
                              repoRefResolver: RepoRefResolver,
                              endpointGoal: Goal,
                              target: Target): ExecuteGoal {

    return async (goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { goalEvent, credentials, id, context, progressLog } = goalInvocation;
        const atomistTeam = context.workspaceId;

        logger.info("Deploying project %s:%s with target [%j]", id.owner, id.repo, target);

        const targetUrls: string[] = _.get(goalEvent, "push.after.images.imageName");
        await Promise.all(targetUrls.map(async targetUrl => {
            const artifactCheckout = await checkOutArtifact(targetUrl, artifactStore, id, credentials, progressLog);
            artifactCheckout.id.branch = goalEvent.branch;

            const deployments = await target.deployer.deploy(artifactCheckout, target.targeter(id, id.branch),
                progressLog, credentials, atomistTeam);

            return Promise.all(deployments.map(deployment => setEndpointGoalOnSuccessfulDeploy(
                { endpointGoal, goalInvocation, deployment, repoRefResolver })));
        }));

        return Success;
    };
}

/**
 * @deprecated Deployer concept will be removed.
 */
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

/**
 * @deprecated Deployer concept will be removed.
 */
export async function setEndpointGoalOnSuccessfulDeploy(params: {
    repoRefResolver: RepoRefResolver,
    endpointGoal: Goal,
    goalInvocation: GoalInvocation,
    deployment: Deployment,
}): Promise<void> {
    const { goalInvocation, deployment, endpointGoal } = params;
    const sdmGoal = await findSdmGoalOnCommit(goalInvocation.context, goalInvocation.id, goalInvocation.goalEvent.repo.providerId, endpointGoal);
    // Only update the endpoint goal if it actually exists in the goal set
    if (sdmGoal) {
        if (deployment.endpoint) {
            const newState = SdmGoalState.success;
            await markEndpointStatus({ context: goalInvocation.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint });
        } else {
            const error = new Error("Deploy finished with success, but the endpoint was not found");
            const newState = SdmGoalState.failure;
            await markEndpointStatus({ context: goalInvocation.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint, error });
        }
    }
}

function markEndpointStatus(parameters: {
    context: HandlerContext, sdmGoal: SdmGoalEvent, endpointGoal: Goal, newState: SdmGoalState, endpoint?: string,
    error?: Error,
}): Promise<void> {
    const { context, sdmGoal, endpointGoal, newState, endpoint, error } = parameters;
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
