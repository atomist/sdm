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
import { toRemoteRepoRef } from "../../../api/command/editor/support/repoRef";
import { AddressChannels, addressChannelsFor } from "../../../api/context/addressChannels";
import { PullRequestListener, PullRequestListenerInvocation } from "../../../api/listener/PullRequestListener";
import { ProjectLoader } from "../../../spi/repo/ProjectLoader";
import * as schema from "../../../typings/types";
import { CredentialsResolver } from "../../common/CredentialsResolver";

/**
 * A pull request has been raised
 */
@EventHandler("On pull request", subscription("OnPullRequest"))
export class OnPullRequest implements HandleEvent<schema.OnPullRequest.Subscription> {

    constructor(
        private readonly projectLoader: ProjectLoader,
        private readonly listeners: PullRequestListener[],
        private readonly credentialsFactory: CredentialsResolver) {
    }

    public async handle(event: EventFired<schema.OnPullRequest.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const pullRequest = event.data.PullRequest[0];
        const repo = pullRequest.repo;
        const id = toRemoteRepoRef(repo, { sha: pullRequest.head.sha });
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);

        const addressChannels: AddressChannels = addressChannelsFor(repo, context);
        await this.projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
            const prli: PullRequestListenerInvocation = {
                id,
                context,
                addressChannels,
                credentials,
                project,
                pullRequest,
            };
            await Promise.all(params.listeners
                .map(l => l(prli)),
            );
        });
        return Success;
    }
}
