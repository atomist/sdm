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

import {
    Failure,
    GraphQL,
    HandleEvent,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { EventFired, EventHandler, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { Phases, PlannedPhase } from "../../../../common/phases/Phases";
import { Deployer, SourceDeployer } from "../../../../spi/deploy/Deployer";
import { OnPendingLocalDeployStatus } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Deploy linked artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPendingLocalDeployStatus.graphql"))
export class DeployFromLocalOnPendingLocalDeployStatus implements HandleEvent<OnPendingLocalDeployStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    /**
     *
     * @param {Phases} phases
     * @param {PlannedPhase} deployPhase
     * @param {PlannedPhase} endpointPhase
     * or Kubernetes clusters
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

        // const statusAndFriends: GitHubStatusAndFriends = {
        //     context: status.context,
        //     state: status.state,
        //     targetUrl: status.targetUrl,
        //     description: status.description,
        //     siblings: status.commit.statuses,
        // };
        //
        // // TODO: determine previous step based on the contexts of existing statuses
        // if (!previousPhaseSucceeded(params.phases, params.deployPhase.context, statusAndFriends)) {
        //     return Success;
        // }
        //
        // if (!currentPhaseIsStillPending(params.deployPhase.context, statusAndFriends)) {
        //     return Success;
        // }
        //
        // // TODO: if any status is failed, do not deploy

        logger.info(`Running deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const da = null;
        const log = await createEphemeralProgressLog();
        try {
            await params.deployer.deployFromSource(
                id,
                log,
                {token: params.githubToken},
                ctx.teamId);
            await createStatus(params.githubToken, id, {
                state: "success",
                context: params.deployPhase.context,
                description: params.deployPhase.completedDescription,
            });
            return Success;
        } catch (e) {
            logger.warn("Deployment failed: %s", e);
            await createStatus(params.githubToken, id, {
                state: "failure",
                context: params.deployPhase.context,
                description: params.deployPhase.workingDescription,
            });
            return Failure;
        } finally {
            log.close();
        }
    }
}
