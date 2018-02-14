import { HandlerContext } from "@atomist/automation-client";
import { SlackMessage } from "@atomist/slack-messages";
import {MessageOptions} from "@atomist/automation-client/spi/message/MessageClient";

export type AddressChannels = (msg: string | SlackMessage, opts?: MessageOptions) => Promise<any>;

export interface HasChannels {
    channels?: Array<{name?: string, id?: string}>;
}

export function addressChannelsFor(hasChannels: HasChannels, ctx: HandlerContext): AddressChannels {
    if (!!hasChannels.channels) {
        const channels = hasChannels.channels.map(c => c.name);
        return (msg, opts) => ctx.messageClient.addressChannels(msg, channels, opts);
    } else {
        return () => Promise.resolve();
    }
}
