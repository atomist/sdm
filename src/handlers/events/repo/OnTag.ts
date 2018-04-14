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
import { TagListener, TagListenerInvocation } from "../../../common/listener/TagListener";
import { addressChannelsFor } from "../../../common/slack/addressChannels";
import * as schema from "../../../typings/types";

/**
 * A new tag has been created
 */
@EventHandler("On tag", subscription("OnTag"))
export class OnTag implements HandleEvent<schema.OnTag.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    constructor(private readonly listeners: TagListener[]) {}

    public async handle(event: EventFired<schema.OnTag.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const tag = event.data.Tag[0];
        const repo = tag.commit.repo;
        const id = new GitHubRepoRef(repo.owner, repo.name);
        const addressChannels = addressChannelsFor(repo, context);
        const invocation: TagListenerInvocation = {
            addressChannels,
            id,
            context,
            tag,
            credentials: {token: params.githubToken},
        };
        await Promise.all(params.listeners.map(l => l(invocation)));
        return Success;
    }
}
