/*
 * Copyright © 2018 Atomist, Inc.
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
    EventFired,
    EventHandler,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    UpdatedIssueInvocation,
    UpdatedIssueListener,
} from "../../../common/listener/UpdatedIssueListener";
import { addressChannelsFor } from "../../../common/slack/addressChannels";
import * as schema from "../../../typings/types";

/**
 * An issue has been updated
 */
@EventHandler("On issue update", GraphQL.subscriptionFromFile(
    "../../../graphql/subscription/OnNewIssue",
    __dirname),
)
export class UpdatedIssueHandler implements HandleEvent<schema.OnIssueAction.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private updatedIssueListeners: UpdatedIssueListener[];

    constructor(...updatedIssueListeners: UpdatedIssueListener[]) {
        this.updatedIssueListeners = updatedIssueListeners;
    }

    public async handle(event: EventFired<schema.OnIssueAction.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const addressChannels = addressChannelsFor(issue.repo, context);
        const id = new GitHubRepoRef(issue.repo.owner, issue.repo.name);

        if (issue.updatedAt === issue.createdAt) {
            logger.info("Issue created, not updated: %s on %j", issue.number, id);
            return Success;
        }

        const inv: UpdatedIssueInvocation = {
            id,
            addressChannels,
            context,
            issue,
            credentials: { token: params.githubToken},
        };
        await Promise.all(params.updatedIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
