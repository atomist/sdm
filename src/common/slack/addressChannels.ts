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

export interface HasChannels {
    channels?: Array<{ name?: string, id?: string, team?: { id?: string }}>;
}

export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    if (!!hasChannels.channels) {
        return addressDestination(messageDestinations(hasChannels, ctx), ctx);
    } else {
        return () => Promise.resolve();
    }
}

export function messageDestinations(hasChannels: HasChannels, ctx: HandlerContext): Destination {
    const channelNames = hasChannels.channels.map(c => c.name);
    if (hasChannels.channels.length === 0) {
        throw new Error("I can't give you destinations for 0 channels");
    }
    const slackTeam = hasChannels[0].channels.team.id;
    return addressSlackChannels(slackTeam, ...channelNames);
}

export function addressDestination(destination: Destination, ctx: HandlerContext): AddressChannels {
    return (msg, opts) => ctx.messageClient.send(msg, destination, opts);
}
