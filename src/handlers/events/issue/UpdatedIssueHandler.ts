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
import { UpdatedIssueListener, UpdatedIssueListenerInvocation } from "../../../api/listener/UpdatedIssueListener";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../typings/types";

/**
 * An issue has been updated
 */
@EventHandler("On issue update", subscription("OnNewIssue"))
export class UpdatedIssueHandler implements HandleEvent<schema.OnIssueAction.Subscription> {

    private readonly updatedIssueListeners: UpdatedIssueListener[];

    constructor(updatedIssueListeners: UpdatedIssueListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {
        this.updatedIssueListeners = updatedIssueListeners;
    }

    public async handle(event: EventFired<schema.OnIssueAction.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const addressChannels = addressChannelsFor(issue.repo, context);
        const id = this.repoRefResolver.toRemoteRepoRef(issue.repo, {});
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);

        if (issue.updatedAt === issue.createdAt) {
            logger.debug("Issue created, not updated: %s on %j", issue.number, id);
            return Success;
        }

        const inv: UpdatedIssueListenerInvocation = {
            id,
            addressChannels,
            context,
            issue,
            credentials,
        };
        await Promise.all(params.updatedIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
