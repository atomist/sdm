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

import { HandlerContext, logger } from "@atomist/automation-client";
import { Destination } from "@atomist/automation-client/spi/message/MessageClient";

/**
 * Safely mutate the given HandlerContext so that it can respond even when used in
 * an EventHandler
 * @param ctx context to wrap
 * @param destinations
 * @return {HandlerContext}
 */
export function teachToRespondInEventHandler(ctx: HandlerContext, ...destinations: Destination[]): HandlerContext {
    const oldRespondMethod = ctx.messageClient.respond;
    ctx.messageClient.respond = async (msg, options) => {
        // First try routing to response. If that doesn't work, we're probably
        // in an event handler. Try linked channels.
        try {
            return await oldRespondMethod(msg, options);
        } catch (err) {
            logger.debug("Rerouting response message to destinations: message was [%s]", msg);
            return ctx.messageClient.send(msg, destinations, options);
        }
    };
    return ctx;
}
