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

import { GraphQL } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";
import { OnRepoCreation } from "../../../typings/types";

@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnRepoCreation.graphql"))
export class ActOnRepoCreation implements HandleEvent<OnRepoCreation.Subscription> {

    public handle(event: EventFired<OnRepoCreation.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        // const push = event.data.Push[0];
        // const commit = push.commits[0];
        // TODO check this

        const repo = event.data.Repo[0];

        // TODO tag it

        const msg = `Saw a new repo: ${repo.owner}:${repo.name}`;
        console.log(msg);

        // if (push.repo && push.repo.channels) {
        //     const channels = push.repo.channels.map(c => c.name);
        //     return ctx.messageClient.addressChannels(msg, channels)
        //         .then(() => Success, failure);
        // } else {
        //     return Promise.resolve(Success);
        // }
        return Promise.resolve(Success);
    }
}
