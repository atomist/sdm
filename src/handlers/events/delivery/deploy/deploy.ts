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

import { HandlerResult, logger, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { StatusState } from "../../../../typings/types";
import { createStatus } from "../../../commands/editors/toclient/ghub";
import { ArtifactStore } from "../ArtifactStore";
import { createLinkableProgressLog } from "../log/NaiveLinkablePersistentProgressLog";
import { ConsoleProgressLog, MultiProgressLog, QueryableProgressLog, SavingProgressLog } from "../log/ProgressLog";
import { GitHubStatusContext, PlannedPhase } from "../Phases";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";
import { parseCloudFoundryLogForEndpoint } from "./pcf/cloudFoundryLogParser";

export async function deploy<T extends TargetInfo>(deployPhase: PlannedPhase,
                                                   endpointPhase: PlannedPhase,
                                                   id: GitHubRepoRef,
                                                   githubToken: string,
                                                   targetUrl: string,
                                                   artifactStore: ArtifactStore,
                                                   deployer: Deployer<T>,
                                                   targeter: (id: RemoteRepoRef) => T): Promise<HandlerResult> {
    const linkableLog = await createLinkableProgressLog();

    try {
        await setDeployStatus(githubToken, id, "pending", deployPhase.context,
            undefined, `Working on ${deployPhase.name}`)
            .catch(err =>
                logger.warn("Failed to update deploy status to tell people we are working on it"));

        const savingLog = new SavingProgressLog();
        const progressLog = new MultiProgressLog(ConsoleProgressLog, savingLog, linkableLog) as any as QueryableProgressLog;

        const ac = await artifactStore.checkout(targetUrl);
        const deployment = await deployer.deploy(ac, targeter(id), progressLog);

        await progressLog.close();
        await setDeployStatus(githubToken, id,
            "success",
            deployPhase.context,
            linkableLog.url,
            `Completed ${deployPhase.name}`);
        if (deployment.endpoint) {
            await setEndpointStatus(githubToken, id,
                endpointPhase.context,
                deployment.endpoint,
                `Completed ${endpointPhase.name}`)
                .catch(endpointStatus => {
                    logger.error("Could not set Endpoint status: " + endpointStatus.message);
                    // do not fail this whole handler
                });
        }
    } catch (err) {
        return setDeployStatus(githubToken, id, "failure",
            deployPhase.context,
            linkableLog.url,
            `Failed to ${deployPhase.name}`);
    }
}

function setDeployStatus(token: string, id: GitHubRepoRef,
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
