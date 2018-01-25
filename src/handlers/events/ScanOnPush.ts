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

import {
    EventFired,
    EventHandler,
    failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";
import { GraphQL } from "@atomist/automation-client";
import { OnPush } from "../../typings/types";
import Push = OnPush.Push;

@EventHandler("Scan code on PR",
    GraphQL.subscriptionFromFile("../../../graphql/subscription/OnPush.graphql"))
export class ScanOnPush implements HandleEvent<OnPush.Push> {

    public handle(event: EventFired<OnPush.Push>, ctx: HandlerContext): Promise<HandlerResult> {
        const commit = event.data.commits[0];
        // TODO check this

        const msg = `Push, mothafucka: ${commit.sha} - ${commit.message}`;
        console.log(msg);

        if (event.data.repo && event.data.repo.channels) {
            const channels = event.data.repo.channels.map(c => c.name);
            return ctx.messageClient.addressChannels(msg, channels)
                .then(() => Success, failure);
        } else {
            return Promise.resolve(Success);
        }
    }
}
