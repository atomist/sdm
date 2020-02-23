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
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import { PreferenceStoreFactory } from "../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../api/context/skillContext";
import {
    TagListener,
    TagListenerInvocation,
} from "../../../../api/listener/TagListener";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../../typings/types";

/**
 * A new tag has been created
 */
@EventHandler("On tag", subscription("OnTag"))
export class OnTag implements HandleEvent<schema.OnTag.Subscription> {

    @Value("")
    public configuration: Configuration;

    constructor(private readonly listeners: TagListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {}

    public async handle(event: EventFired<schema.OnTag.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const tag = event.data.Tag[0];
        const repo = tag.commit.repo;

        const id = this.repoRefResolver.toRemoteRepoRef(repo, {});
        const credentials = await resolveCredentialsPromise(this.credentialsFactory.eventHandlerCredentials(context, id));
        const addressChannels = addressChannelsFor(repo, context);
        const preferences = this.preferenceStoreFactory(context);

        const invocation: TagListenerInvocation = {
            addressChannels,
            preferences,
            configuration: this.configuration,
            id,
            context,
            tag,
            credentials,
            skill: createSkillContext(context),
        };
        await Promise.all(this.listeners.map(l => l(invocation)));
        return Success;
    }
}
