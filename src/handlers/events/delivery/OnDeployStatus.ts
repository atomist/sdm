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
import { OnSuccessStatus } from "../../../typings/types";
import { SavingProgressLog } from "./ProgressLog";
import Status = OnSuccessStatus.Status;
import { successOn } from "@atomist/automation-client/action/ActionResult";

export type DeployListener = (id: GitHubRepoRef, s: Status, ctx: HandlerContext) => Promise<any>;

/**
 * React to a deployment on in a GitHub "artifact" status.
 */
@EventHandler("Deploy published artifact",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnSuccessStatus.graphql",
        __dirname, {
            context: "deployment",
        }))
export class OnDeployStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private action: DeployListener) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {

        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== "deployment") {
            console.log(`********* OnDeploy got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const persistentLog = new SavingProgressLog();
        const progressLog = persistentLog;

        return params.action(id, status, ctx)
            .then(r => Success);
    }

}
