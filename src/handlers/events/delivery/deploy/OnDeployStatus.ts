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

import { GraphQL, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { DeploymentListener, DeploymentListenerInvocation } from "../../../../common/listener/DeploymentListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { OnSuccessStatus } from "../../../../typings/types";
import { StagingDeploymentContext } from "../phases/httpServicePhases";

/**
 * React to a deployment.
 */
@EventHandler("React to a successful deployment",
    GraphQL.subscriptionFromFile("graphql/subscription/OnSuccessStatus.graphql",
        undefined, {
            context: StagingDeploymentContext,
        }))
export class OnDeployStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private listeners: DeploymentListener[];

    constructor(...listeners: DeploymentListener[]) {
        this.listeners = listeners;
    }

    public async handle(event: EventFired<OnSuccessStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== StagingDeploymentContext) {
            logger.debug(`********* OnDeploy got called with status context=[${status.context}]`);
            return Success;
        }
        const addressChannels = addressChannelsFor(commit.repo, context);
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        const dil: DeploymentListenerInvocation = {
            context,
            status,
            id,
            addressChannels,
            credentials,
        };
        await Promise.all(params.listeners.map(l => l(dil)));
        return Success;
    }

}
