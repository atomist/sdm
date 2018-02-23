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

import { GraphQL, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnSuccessStatus } from "../../../../typings/types";
import Status = OnSuccessStatus.Status;
import { AddressChannels, addressChannelsFor } from "../../../commands/editors/toclient/addressChannels";
import { StagingDeploymentContext } from "../phases/httpServicePhases";

/**
 * React to a successful deployment
 */
export type DeployListener = (id: GitHubRepoRef,
                              s: Status,
                              addressChannels: AddressChannels,
                              ctx: HandlerContext) => Promise<any>;

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

    private actions: DeployListener[];

    constructor(...actions: DeployListener[]) {
        this.actions = actions;
    }

    public async handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== StagingDeploymentContext) {
            console.log(`********* OnDeploy got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        const addressChannels = addressChannelsFor(commit.repo, ctx);
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        await Promise.all(params.actions.map(action => action(id, status, addressChannels, ctx)));
        return Success;
    }

}
