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
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { BuildStatus, OnBuildComplete } from "../../../../typings/types";
import { createStatus, State } from "../../../../util/github/ghub";

/**
 * Set build status on complete build
 */
@EventHandler("Check endpoint",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuildComplete.graphql"))
export class SetStatusOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private context: string) {
    }

    public async handle(event: EventFired<OnBuildComplete.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit = build.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const builtStatus = commit.statuses.find(s => s.context === params.context);
        if (!!builtStatus && builtStatus.state === "pending") {
            await setBuiltContext(params.context, buildStatusToGitHubStatusState(build.status),
                build.buildUrl, id, {token: params.githubToken});
        }
        return Success;
    }
}

function buildStatusToGitHubStatusState(buildStatus: BuildStatus): State {
    switch (buildStatus) {
        case "passed" :
            return "success";
        case "broken":
        case "failed":
        case "canceled" :
            return "failure";
        default:
            return "pending";
    }
}

async function setBuiltContext(context: string, state: State, url: string, id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: url,
        context,
        description: `Completed ${context}`,
    });
}
