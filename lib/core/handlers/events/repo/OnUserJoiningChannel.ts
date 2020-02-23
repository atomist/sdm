/*
 * Copyright © 2020 Atomist, Inc.
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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import {
    EventHandler,
    Value,
} from "@atomist/automation-client/lib/decorators";
import { subscription } from "@atomist/automation-client/lib/graph/graphQL";
import {
    EventFired,
    HandleEvent,
} from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    HandlerResult,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { resolveCredentialsPromise } from "../../../../api-helper/machine/handlerRegistrations";
import { PreferenceStoreFactory } from "../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../api/context/skillContext";
import {
    UserJoiningChannelListener,
    UserJoiningChannelListenerInvocation,
} from "../../../../api/listener/UserJoiningChannelListener";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../../typings/types";

/**
 * A user joined a channel
 */
@EventHandler("On user joining channel", subscription("OnUserJoiningChannel"))
export class OnUserJoiningChannel implements HandleEvent<schema.OnUserJoiningChannel.Subscription> {

    @Value("")
    public configuration: Configuration;

    constructor(private readonly listeners: UserJoiningChannelListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {
    }

    public async handle(event: EventFired<schema.OnUserJoiningChannel.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const joinEvent = event.data.UserJoinedChannel[0];
        const repos = joinEvent.channel.repos.map(
            repo => this.repoRefResolver.toRemoteRepoRef(repo, {}));

        const credentials = await resolveCredentialsPromise(this.credentialsFactory.eventHandlerCredentials(context, repos[0]));
        const addressChannels = (msg, opts) => context.messageClient.addressChannels(msg, joinEvent.channel.name, opts);
        const preferences = this.preferenceStoreFactory(context);

        const invocation: UserJoiningChannelListenerInvocation = {
            addressChannels,
            preferences,
            configuration: this.configuration,
            context,
            credentials,
            joinEvent,
            repos,
            skill: createSkillContext(context),
        };

        await Promise.all(this.listeners
            .map(l => l(invocation)),
        );
        return Success;
    }
}
