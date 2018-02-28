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

import { GraphQL, Secret, Secrets } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { NewIssueInvocation, NewIssueListener } from "../../../common/listener/NewIssueListener";
import { addressChannelsFor } from "../../../common/slack/addressChannels";
import * as schema from "../../../typings/types";

/**
 * A new issue has been created.
 */
@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnNewIssue.graphql"))
export class OnNewIssue implements HandleEvent<schema.OnNewIssue.Subscription> {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    private newIssueListeners: NewIssueListener[];

    constructor(...newIssueListeners: NewIssueListener[]) {
        this.newIssueListeners = newIssueListeners;
    }

    public async handle(event: EventFired<schema.OnNewIssue.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const addressChannels = addressChannelsFor(issue.repo, context);
        const id = new GitHubRepoRef(issue.repo.owner, issue.repo.name);
        const inv: NewIssueInvocation = {
            id,
            addressChannels,
            context,
            issue,
            credentials: { token: params.githubToken},
        };
        await Promise.all(params.newIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
