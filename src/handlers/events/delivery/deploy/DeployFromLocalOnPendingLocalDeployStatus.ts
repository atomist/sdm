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

import { Failure, GraphQL, HandleEvent, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ConsoleProgressLog } from "../../../../common/log/progressLogs";
import { Phases, PlannedPhase } from "../../../../common/phases/Phases";
import { SourceDeployer } from "../../../../spi/deploy/SourceDeployer";
import { OnPendingLocalDeployStatus } from "../../../../typings/types";
import { setDeployStatus, setEndpointStatus } from "./deploy";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";

/**
 * Deploy from local on pending status
 */
@EventHandler("Deploy from local on pending status",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPendingLocalDeployStatus.graphql"))
export class DeployFromLocalOnPendingLocalDeployStatus implements HandleEvent<OnPendingLocalDeployStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    /**
     *
     * @param {Phases} phases
     * @param {PlannedPhase} deployPhase
     * @param {PlannedPhase} endpointPhase
     * @param deployer source deployer to use
     */
    constructor(public phases: Phases,
                private deployPhase: PlannedPhase,
                private endpointPhase: PlannedPhase,
                private deployer: SourceDeployer) {
    }

    public async handle(event: EventFired<OnPendingLocalDeployStatus.Subscription>,
                        ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        // This happens immediately, not conditional on any other status
        logger.info(`Running local deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const log = ConsoleProgressLog;
        const addressChannels = addressChannelsFor(commit.repo, ctx);
        try {
            const deployment = await params.deployer.deployFromSource(
                id,
                addressChannels,
                log,
                {token: params.githubToken},
                ctx.teamId,
                status.commit.pushes[0].branch);
            await setDeployStatus(params.githubToken, id,
                "success",
                params.deployPhase.context, undefined, params.deployPhase.completedDescription);
            if (!!deployment.endpoint) {
                await setEndpointStatus(params.githubToken, id,
                    params.endpointPhase.context, deployment.endpoint, params.endpointPhase.completedDescription);
            }
            return Success;
        } catch (e) {
            logger.warn("Deployment failed: %s", e);
            await setDeployStatus(params.githubToken, id,
                "failure",
                params.deployPhase.context, undefined, params.deployPhase.workingDescription);
            return Failure;
        } finally {
            log.close();
        }
    }
}
