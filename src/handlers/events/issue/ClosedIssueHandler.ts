/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { addressChannelsFor } from "../../../api/context/addressChannels";
import { ClosedIssueListener, ClosedIssueListenerInvocation } from "../../../api/listener/ClosedIssueListener";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../typings/types";

/**
 * A new issue has been created.
 */
@EventHandler("On an issue being closed", subscription("OnClosedIssue"))
export class ClosedIssueHandler implements HandleEvent<schema.OnClosedIssue.Subscription> {

    private readonly closedIssueListeners: ClosedIssueListener[];

    constructor(closedIssueListeners: ClosedIssueListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {
        this.closedIssueListeners = closedIssueListeners;
    }

    public async handle(event: EventFired<schema.OnClosedIssue.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const id = params.repoRefResolver.toRemoteRepoRef(issue.repo, {});
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);

        const addressChannels = addressChannelsFor(issue.repo, context);
        const inv: ClosedIssueListenerInvocation = {
            id,
            addressChannels,
            context,
            issue,
            credentials,
        };
        await Promise.all(params.closedIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
