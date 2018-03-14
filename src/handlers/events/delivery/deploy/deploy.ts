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
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Deployment } from "../../../../";
import { GitHubStatusContext } from "../../../../common/goals/gitHubContext";
import { Goal } from "../../../../common/goals/Goal";
import { AddressChannels } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { ArtifactDeployer } from "../../../../spi/deploy/ArtifactDeployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { SourceDeployer } from "../../../../spi/deploy/SourceDeployer";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { StatusState } from "../../../../typings/types";

import { createStatus } from "../../../../util/github/ghub";
import { ManagedDeploymentTargeter } from "./local/appManagement";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T;

export interface DeployArtifactParams<T extends TargetInfo> {
    id: GitHubRepoRef;
    credentials: ProjectOperationCredentials;
    addressChannels: AddressChannels;
    team: string;
    deployGoal: Goal;
    endpointGoal: Goal;
    artifactStore: ArtifactStore;
    deployer: ArtifactDeployer<T>;
    targeter: Targeter<T>;
    targetUrl: string;
    progressLog: ProgressLog;
    branch: string;
}

export interface DeploySourceParams {
    id: GitHubRepoRef;
    credentials: ProjectOperationCredentials;
    addressChannels: AddressChannels;
    team: string;
    deployGoal: Goal;
    endpointGoal: Goal;
    deployer: SourceDeployer;
    progressLog: ProgressLog;
    branch: string;
}

export async function deploySource(params: DeploySourceParams): Promise<void> {
    logger.info("Deploying with params=%j", params);

    const target = ManagedDeploymentTargeter(params.id, params.branch);

    const deployment = await params.deployer.deployFromSource(
        params.id,
        target,
        params.progressLog,
        params.credentials,
        params.team);

    await reactToSuccessfulDeploy(params, deployment);
}

export async function deploy<T extends TargetInfo>(params: DeployArtifactParams<T>): Promise<void> {
    logger.info("Deploying with params=%j", params);
    const progressLog = params.progressLog;

    const artifactCheckout = await params.artifactStore.checkout(params.targetUrl, params.id,
        params.credentials)
        .catch(err => {
            progressLog.write("Error checking out artifact: " + err.message);
            throw err;
        });
    if (!artifactCheckout) {
        throw new Error("No DeployableArtifact passed in");
    }

    const deployment = await params.deployer.deploy(
        artifactCheckout,
        params.targeter(params.id, params.branch),
        progressLog,
        params.credentials,
        params.team);

    await reactToSuccessfulDeploy(params, deployment);
}

export async function reactToSuccessfulDeploy(params: {
    deployGoal: Goal,
    endpointGoal: Goal,
    credentials: ProjectOperationCredentials,
    id: RemoteRepoRef,
    addressChannels: AddressChannels
    progressLog: ProgressLog,
},                                            deployment: Deployment) {

    await setStatus(params.credentials, params.id,
        StatusState.success,
        params.deployGoal.context,
        params.progressLog.url,
        params.deployGoal.completedDescription);
    if (deployment.endpoint) {
        await setStatus(params.credentials, params.id,
            StatusState.success,
            params.endpointGoal.context,
            deployment.endpoint,
            params.endpointGoal.completedDescription)
            .catch(endpointStatus => {
                logger.error("Could not set Endpoint status: " + endpointStatus.message);
                // do not fail this whole handler
            });
    } else {
        await
            params.addressChannels("Deploy succeeded, but the endpoint didn't appear in the log.");
        await
            params.addressChannels({
                content: params.progressLog.log,
                fileType: "text",
                fileName: `deploy-success-${params.id.sha}.log`,
            } as any);
        logger.warn("No endpoint returned by deployment");
    }
}

export function setStatus(credentials: ProjectOperationCredentials,
                          id: RemoteRepoRef,
                          state: StatusState,
                          context: GitHubStatusContext,
                          targetUrl: string,
                          description?: string): Promise<any> {
    logger.info(`Setting deploy status for ${context} to ${state} at ${targetUrl}`);
    return createStatus((credentials as TokenCredentials).token, id as GitHubRepoRef, {
        state,
        target_url: targetUrl,
        context,
        description,
    });
}
