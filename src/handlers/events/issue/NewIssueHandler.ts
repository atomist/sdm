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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { addressChannelsFor } from "../../../api/context/addressChannels";
import { NewIssueListener, NewIssueListenerInvocation } from "../../../api/listener/NewIssueListener";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../typings/types";

/**
 * A new issue has been created.
 */
@EventHandler("On issue creation", subscription("OnNewIssue"))
export class NewIssueHandler implements HandleEvent<schema.OnIssueAction.Subscription> {

    private readonly newIssueListeners: NewIssueListener[];

    constructor(newIssueListeners: NewIssueListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {
        this.newIssueListeners = newIssueListeners;
    }

    public async handle(event: EventFired<schema.OnIssueAction.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const addressChannels = addressChannelsFor(issue.repo, context);
        const id = params.repoRefResolver.toRemoteRepoRef(issue.repo, {});

        if (issue.updatedAt !== issue.createdAt) {
            logger.debug("Issue updated, not created: %s on %j", issue.number, id);
            return Success;
        }
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);

        const inv: NewIssueListenerInvocation = {
            id,
            addressChannels,
            context,
            issue,
            credentials,
        };
        await Promise.all(params.newIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
