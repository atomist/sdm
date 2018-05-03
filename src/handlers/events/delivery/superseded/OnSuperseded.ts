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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { SupersededListener, SupersededListenerInvocation } from "../../../../common/listener/SupersededListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import * as schema from "../../../../typings/types";
import { toRemoteRepoRef } from "../../../../util/git/repoRef";
import { CredentialsResolver } from "../../../common/CredentialsResolver";
import { GitHubCredentialsResolver } from "../../../common/GitHubCredentialsResolver";

/**
 * Respond to a superseded push
 */
@EventHandler("React to a superseded push", subscription("OnSupersededStatus"))
export class OnSupersededStatus implements HandleEvent<schema.OnSupersededStatus.Subscription> {

    constructor(private readonly listeners: SupersededListener[],
                private readonly credentialsFactory: CredentialsResolver = new GitHubCredentialsResolver()) {}

    public async handle(event: EventFired<schema.OnSupersededStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const id = toRemoteRepoRef(commit.repo, { sha: commit.sha });
        const credentials = this.credentialsFactory.eventHandlerCredentials(context);
        const i: SupersededListenerInvocation = {
            id,
            context,
            addressChannels: addressChannelsFor(commit.repo, context),
            status,
            credentials,
        };

        await Promise.all(params.listeners.map(l => l(i)));
        return Success;
    }
}
