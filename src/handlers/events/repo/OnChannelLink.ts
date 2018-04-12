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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ChannelLinkListener, ChannelLinkListenerInvocation } from "../../../common/listener/ChannelLinkListenerInvocation";
import { ProjectLoader } from "../../../common/repo/ProjectLoader";
import { AddressChannels, addressChannelsFor } from "../../../common/slack/addressChannels";
import * as schema from "../../../typings/types";

/**
 * A new channel has been linked to a repo
 */
@EventHandler("On channel link", subscription("OnChannelLink"))
export class OnChannelLink implements HandleEvent<schema.OnChannelLink.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    constructor(
        private readonly projectLoader: ProjectLoader,
        private readonly listeners: ChannelLinkListener[]) {
    }

    public async handle(event: EventFired<schema.OnChannelLink.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const repo = event.data.ChannelLink[0].repo;
        const id = new GitHubRepoRef(repo.owner, repo.name);
        const credentials = {token: params.githubToken};

        const addressChannels: AddressChannels = addressChannelsFor(repo, context);
        const newlyLinkedChannelName = event.data.ChannelLink[0].channel.name;
        await this.projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
            const invocation: ChannelLinkListenerInvocation = {
                id,
                context,
                addressChannels,
                credentials,
                project,
                newlyLinkedChannelName,
                addressNewlyLinkedChannel: (msg, opts) => context.messageClient.addressChannels(msg, newlyLinkedChannelName, opts),
            };
            await Promise.all(params.listeners
                .map(l => l(invocation)),
            );
        });
        return Success;
    }
}
