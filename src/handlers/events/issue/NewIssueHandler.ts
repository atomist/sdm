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

import { GraphQL } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";
import { OnNewIssue } from "../../../typings/types";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { AddressChannels, addressChannelsFor } from "../../commands/editors/toclient/addressChannels";

export type Issue = OnNewIssue.Issue;

export type NewIssueListener = (issue: Issue,
                                id: GitHubRepoRef,
                                addressChannels: AddressChannels,
                                ctx: HandlerContext) => Promise<any>;

/**
 * A new repo has been created. We don't know if it has code.
 */
@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnNewIssue.graphql"))
export class NewIssueHandler implements HandleEvent<OnNewIssue.Subscription> {

    constructor(private newIssueListeners: NewIssueListener[]) {
    }

    public async handle(event: EventFired<OnNewIssue.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const issue: Issue = event.data.Issue[0];
        const ac = addressChannelsFor(issue.repo, ctx);
        const id = new GitHubRepoRef(issue.repo.owner, issue.repo.name);
        await Promise.all(params.newIssueListeners
            .map(l => l(issue, id, ac, ctx)));
        return Success;
    }
}
