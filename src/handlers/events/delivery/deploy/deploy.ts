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
import { AddressChannels } from "../../../../common/addressChannels";
import { createLinkableProgressLog } from "../../../../spi/log/NaiveLinkablePersistentProgressLog";
import { ConsoleProgressLog, MultiProgressLog, QueryableProgressLog, SavingProgressLog } from "../../../../spi/log/ProgressLog";
import { StatusState } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { ArtifactStore } from "../ArtifactStore";
import { PlannedPhase } from "../Phases";
import { GitHubStatusContext } from "../phases/gitHubContext";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";

export interface DeployParams<T extends TargetInfo> {
    deployPhase: PlannedPhase;
    endpointPhase: PlannedPhase;
    id: GitHubRepoRef;
    githubToken: string;
    targetUrl: string;
    artifactStore: ArtifactStore;
    deployer: Deployer<T>;
    targeter: (id: RemoteRepoRef) => T;
    ac: AddressChannels;
    retryButton?: Action;
    team: string;
}

export async function deploy<T extends TargetInfo>(params: DeployParams<T>): Promise<HandlerResult> {
    logger.info("Deploying with params=%j", params);
    const linkableLog = await createLinkableProgressLog();

    const savingLog = new SavingProgressLog();
    const progressLog = new MultiProgressLog(ConsoleProgressLog, savingLog, linkableLog) as any as QueryableProgressLog;

    try {
        await setDeployStatus(params.githubToken, params.id, "pending", params.deployPhase.context,
            undefined, `Working on ${params.deployPhase.name}`)
            .catch(err =>
                logger.warn("Failed to update deploy status to tell people we are working on it"));

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
            params.targeter(params.id),
            progressLog,
            {token: params.githubToken},
            params.team);

        await progressLog.close();

        await setDeployStatus(params.githubToken, params.id,
            "success",
            params.deployPhase.context,
            linkableLog.url,
            `Completed ${params.deployPhase.name}`);
        if (deployment.endpoint) {
            await setEndpointStatus(params.githubToken, params.id,
                params.endpointPhase.context,
                deployment.endpoint,
                `Completed ${params.endpointPhase.name}`)
                .catch(endpointStatus => {
                    logger.error("Could not set Endpoint status: " + endpointStatus.message);
                    // do not fail this whole handler
                });
        }
    } catch (err) {
        logger.error(err.message);
        logger.error(err.stack);
        await progressLog.close();
        const interpretation = params.deployer.logInterpreter && params.deployer.logInterpreter(linkableLog.log);
        // The deployer might have information about the failure; report it in the channels
        if (interpretation) {
            await reportFailureInterpretation("deploy", interpretation, linkableLog, params.id, params.ac, params.retryButton);
        } else {
            await params.ac(":x: Failure deploying: " + err.message);
        }
        return setDeployStatus(params.githubToken, params.id, "failure",
            params.deployPhase.context,
            linkableLog.url,
            `Failed to ${params.deployPhase.name}`).then(success);
    }
}

function setDeployStatus(token: string,
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

function setEndpointStatus(token: string, id: GitHubRepoRef,
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
