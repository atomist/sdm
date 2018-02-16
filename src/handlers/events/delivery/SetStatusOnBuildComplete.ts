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
import { OnBuildComplete } from "../../../typings/types";
import { createStatus } from "../../commands/editors/toclient/ghub";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Set build status on complete build
 */
@EventHandler("Check endpoint",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnBuildComplete.graphql",
        __dirname))
export class SetStatusOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private context: string) {
    }

    public async handle(event: EventFired<OnBuildComplete.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Build[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const builtStatus = commit.statuses.find(s => s.context === params.context);
        if (!!builtStatus && builtStatus.state === "pending") {
            return setBuiltContext(params.context, id, {token: params.githubToken});
        }
        return Success;
    }
}

async function setBuiltContext(context: string, id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "success",
        target_url: "http://xxx.co",
        context,
        description: `Completed ${context}`,
    });
}
