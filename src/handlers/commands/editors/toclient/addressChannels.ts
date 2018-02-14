import { HandlerContext } from "@atomist/automation-client";
import { SlackMessage } from "@atomist/slack-messages";
import {addressSlackChannels, Destination, MessageOptions} from "@atomist/automation-client/spi/message/MessageClient";

export type AddressChannels = (msg: string | SlackMessage, opts?: MessageOptions) => Promise<any>;

export interface HasChannels {
    channels?: Array<{name?: string, id?: string}>;
}

export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    if (!!hasChannels.channels) {
        return (msg, opts) => ctx.messageClient.send(msg, messageDestinations(hasChannels, ctx), opts);
    } else {
        return () => Promise.resolve();
    }
}

export function messageDestinations(hasChannels: HasChannels, ctx: HandlerContext): Destination {
    const channels = hasChannels.channels.map(c => c.name);
    return addressSlackChannels(ctx.teamId, ...channels);
}
