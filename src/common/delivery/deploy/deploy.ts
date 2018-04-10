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

import { HandlerContext, logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SdmGoal, SdmGoalState } from "../../../ingesters/sdmGoalIngester";
import { ArtifactStore, DeployableArtifact } from "../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../spi/deploy/Deployer";
import { Deployment, TargetInfo } from "../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { providerIdFromStatus } from "../../../util/git/repoRef";
import { Goal } from "../goals/Goal";
import { descriptionFromState, updateGoal } from "../goals/storeGoals";
import { findSdmGoalOnCommit } from "../goals/support/fetchGoalsOnCommit";
import { RunWithLogContext } from "../goals/support/reportGoalError";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T;

export interface DeployStage {
    deployGoal: Goal;
    endpointGoal: Goal;
    undeployGoal: Goal;
}

export interface DeployerInfo<T extends TargetInfo> {
    deployer: Deployer<T>;
    targeter: Targeter<T>;
}

export interface Target<T extends TargetInfo = TargetInfo> extends DeployerInfo<T>, DeployStage {
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
    endpointGoal: Goal,
    rwlc: RunWithLogContext,
    deployment: Deployment,
}) {
    const {rwlc, deployment, endpointGoal} = params;
    const sdmGoal = await findSdmGoalOnCommit(rwlc.context, rwlc.id, providerIdFromStatus(rwlc.status), endpointGoal);
    if (deployment.endpoint) {
        const newState = "success";
        await markEndpointStatus({context: rwlc.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint});
    } else {
        const error = new Error("Deploy finished with success, but the endpoint was not found");
        const newState = "failure";
        await markEndpointStatus({context: rwlc.context, sdmGoal, endpointGoal, newState, endpoint: deployment.endpoint, error});
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
