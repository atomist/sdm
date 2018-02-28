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
import { SupersededListener, SupersededListenerInvocation } from "../../../../common/listener/SupersededListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import * as schema from "../../../../typings/types";

/**
 * Respond to a superseded push
 */
@EventHandler("React to a superseded push",
    GraphQL.subscriptionFromFile("graphql/subscription/OnSupersededStatus.graphql"))
export class OnSupersededStatus implements HandleEvent<schema.OnSupersededStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private listeners: SupersededListener[];

    constructor(...listeners: SupersededListener[]) {
        this.listeners = listeners;
    }

    public async handle(event: EventFired<schema.OnSupersededStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const i: SupersededListenerInvocation = {
            id,
            context,
            addressChannels: addressChannelsFor(commit.repo, context),
            status,
            credentials: { token: params.githubToken},
        };

        await Promise.all(params.listeners.map(l => l(i)));
        return Success;
    }
}
