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
import { StagingDeploymentContext } from "../phases/httpServicePhases";
import Status = OnSuccessStatus.Status;

export type DeployListener = (id: GitHubRepoRef, s: Status, ctx: HandlerContext) => Promise<any>;

/**
 * React to a deployment.
 */
@EventHandler("React to a successful deployment",
    GraphQL.subscriptionFromFile("../../../../../../graphql/subscription/OnSuccessStatus.graphql",
        __dirname, {
            context: StagingDeploymentContext,
        }))
export class OnDeployStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private action: DeployListener) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== StagingDeploymentContext) {
            console.log(`********* OnDeploy got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return params.action(id, status, ctx)
            .then(r => Success);
    }

}
