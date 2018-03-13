/*
 * Copyright © 2017 Atomist, Inc.
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

import { HandlerResult, logger, success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Action } from "@atomist/slack-messages";
import { GitHubStatusContext } from "../../../../common/goals/gitHubContext";
import { Goal } from "../../../../common/goals/Goal";
import { ConsoleProgressLog, InMemoryProgressLog, MultiProgressLog } from "../../../../common/log/progressLogs";
import { AddressChannels } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { LogFactory } from "../../../../spi/log/ProgressLog";
import { StatusState } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { ProgressLog } from "../../../../";

export type Targeter<T extends TargetInfo> = (id: RemoteRepoRef, branch: string) => T

export interface DeployParams<T extends TargetInfo> {
    deployGoal: Goal;
    endpointGoal: Goal;
    id: GitHubRepoRef;
    githubToken: string;
    targetUrl: string;
    artifactStore: ArtifactStore;
    deployer: Deployer<T>;
    targeter: Targeter<T>;
    ac: AddressChannels;
    team: string;
    progressLog: ProgressLog;
    branch: string;
}

export async function deploy<T extends TargetInfo>(params: DeployParams<T>): Promise<void> {
    logger.info("Deploying with params=%j", params);
    const progressLog = params.progressLog;

        const artifactCheckout = await params.artifactStore.checkout(params.targetUrl, params.id,
            {token: params.githubToken})
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
            {token: params.githubToken},
            params.team);

        await setDeployStatus(params.githubToken, params.id,
            "success",
            params.deployGoal.context,
            progressLog.url,
            params.deployGoal.completedDescription);
        if (deployment.endpoint) {
            await setEndpointStatus(params.githubToken, params.id,
                params.endpointGoal.context,
                deployment.endpoint,
                params.endpointGoal.completedDescription)
                .catch(endpointStatus => {
                    logger.error("Could not set Endpoint status: " + endpointStatus.message);
                    // do not fail this whole handler
                });
        } else {
            await params.ac("Deploy succeeded, but the endpoint didn't appear in the log.");
            await params.ac({
                content: progressLog.log,
                fileType: "text",
                fileName: `deploy-success-${params.id.sha}.log`,
            } as any);
            logger.warn("No endpoint returned by deployment");
        }
}

export function setDeployStatus(token: string,
                                id: GitHubRepoRef,
                                state: StatusState,
                                context: GitHubStatusContext,
                                targetUrl: string,
                                description?: string): Promise<any> {
    logger.info(`Setting deploy status for ${context} to ${state} at ${targetUrl}`);
    return createStatus(token, id, {
        state,
        target_url: targetUrl,
        context,
        description,
    });
}

export function setEndpointStatus(token: string,
                                  id: GitHubRepoRef,
                                  context: GitHubStatusContext,
                                  endpoint: string,
                                  description?: string): Promise<any> {
    return createStatus(token, id, {
        state: "success",
        target_url: endpoint,
        context,
        description,
    });
}
