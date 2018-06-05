import { Destination, MessageClient, MessageOptions, SlackMessageClient } from "@atomist/automation-client/spi/message/MessageClient";
import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import { SlackMessage } from "@atomist/slack-messages";

export class LoggingMessageClient implements MessageClient, SlackMessageClient {

    public async respond(msg: any, options?: MessageOptions): Promise<any> {
        logger.info("respond > " + msg);
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        logger.info("send > " + stringify(event));
    }

    public async addressChannels(msg: string | SlackMessage, channels: string | string[], options?: MessageOptions): Promise<any> {
        logger.info(`#${channels} ${msg}`);
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        logger.info(`@${users} ${msg}`);
    }

}
