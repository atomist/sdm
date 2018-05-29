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

import { HandlerContext } from "@atomist/automation-client";
import {
    addressSlackChannels,
    Destination,
    MessageOptions,
} from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";

/**
 * Allows us to address channels for a particular repo or any GraphQL
 * type with channels
 */
export type AddressChannels = (msg: string | SlackMessage, opts?: MessageOptions) => Promise<any>;

/**
 * Throw away contents. Use when we know that there can be no linked channels.
 * @constructor
 */
export const AddressNoChannels: AddressChannels = async () => undefined;

/**
 * Interface for anything, like a repo, that has associated chat channel information
 */
export interface HasChannels {
    channels?: Array<{ name?: string, id?: string, team?: { id?: string }}>;
}

/**
 * Address the chat channels associated with this object.
 * Typically used to address channels associated with a repo.
 * @param {HasChannels} hasChannels
 * @param {HandlerContext} ctx
 * @return {AddressChannels}
 */
export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    if (hasChannels.channels && hasChannels.channels.length > 0) {
        return addressDestinations(ctx, ...messageDestinationsFor(hasChannels, ctx));
    } else {
        return () => Promise.resolve();
    }
}

export function messageDestinationsFor(hasChannels: HasChannels, ctx?: HandlerContext): Destination[] {
    return hasChannels.channels.map(ch => addressSlackChannels(ch.team.id, ch.name));
}

export function addressDestinations(ctx: HandlerContext, ...destinations: Destination[]): AddressChannels {
    return (msg, opts) => ctx.messageClient.send(msg, destinations, opts);
}
