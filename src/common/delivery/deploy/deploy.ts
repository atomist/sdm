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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef, RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ArtifactStore, DeployableArtifact } from "../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../spi/deploy/Deployer";
import { Deployment, TargetInfo } from "../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { StatusState } from "../../../typings/types";
import { AddressChannels } from "../../slack/addressChannels";
import { GitHubStatusContext } from "../goals/gitHubContext";
import { Goal } from "../goals/Goal";

import { createStatus } from "../../../util/github/ghub";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T;

export interface DeployStage {
    deployGoal: Goal;
    endpointGoal: Goal;
}

export interface DeployerInfo<T extends TargetInfo> {
    deployer: Deployer<T>;
    targeter: Targeter<T>;
}

export interface Target<T extends TargetInfo> extends DeployerInfo<T>, DeployStage {
}

export interface DeployArtifactParams<T extends TargetInfo> extends Target<T> {
    id: GitHubRepoRef;
    credentials: ProjectOperationCredentials;
    addressChannels: AddressChannels;
    team: string;
    artifactStore: ArtifactStore;
    targetUrl: string;
    progressLog: ProgressLog;
    branch: string;
}

export async function checkOutArtifact(targetUrl: string,
                                       artifactStore: ArtifactStore,
                                       id: RemoteRepoRef,
                                       credentials: ProjectOperationCredentials,
                                       progressLog: ProgressLog): Promise<DeployableArtifact> {
    if (!targetUrl) {
        return sourceArtifact(id);
    }
    const artifactCheckout = await artifactStore.checkout(targetUrl, id, credentials)
        .catch(err => {
            progressLog.write("Error checking out artifact: " + err.message);
            throw err;
        });

    if (!artifactCheckout) {
        throw new Error("No DeployableArtifact passed in");
    }
    return artifactCheckout;
}

function sourceArtifact(id: RemoteRepoRef): DeployableArtifact {
    return {
        // TODO need to do something about this: Use general identifier as in PCF editor?
        name: id.repo,
        version: "0.1.0",
        id: id,
    }
}

export async function setEndpointStatusOnSuccessfulDeploy(params: {
                                                              endpointGoal: Goal,
                                                              credentials: ProjectOperationCredentials,
                                                              id: RemoteRepoRef,
                                                          },
                                                          deployment: Deployment) {

    if (deployment.endpoint) {
        await setStatus(params.credentials, params.id,
            StatusState.success,
            params.endpointGoal.context,
            deployment.endpoint,
            params.endpointGoal.successDescription)
            .catch(endpointStatus => {
                logger.error("Could not set Endpoint status: " + endpointStatus.message);
                // do not fail this whole handler
            });
    } else {
        throw new Error("Deploy finished with success, but the endpoint was not found in the logs")
    }
}

export function setStatus(credentials: ProjectOperationCredentials,
                          id: RemoteRepoRef,
                          state: StatusState,
                          context: GitHubStatusContext,
                          targetUrl: string,
                          description?: string): Promise<any> {
    logger.info("Setting deploy status for %s to %s at %s", context, state, targetUrl);
    return createStatus((credentials as TokenCredentials).token, id as GitHubRepoRef, {
        state,
        target_url: targetUrl,
        context,
        description,
    });
}
