import { HandlerContext } from "@atomist/automation-client";
import { SlackMessage } from "@atomist/slack-messages";

export type AddressChannels = (msg: string | SlackMessage) => Promise<any>;

export interface HasChannels {
    channels?: Array<{name?: string, id?: string}>;
}

export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    if (!!hasChannels.channels) {
        const channels = hasChannels.channels.map(c => c.name);
        return msg => ctx.messageClient.addressChannels(msg, channels);
    } else {
        return () => Promise.resolve();
    }
}
