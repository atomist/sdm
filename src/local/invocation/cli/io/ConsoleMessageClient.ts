import { Destination, MessageClient, MessageOptions, SlackMessageClient } from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";
import { writeToConsole } from "../support/consoleOutput";

// tslint:disable-next-line:no-var-requires
const chalk = require("chalk");

export class ConsoleMessageClient implements MessageClient, SlackMessageClient {

    public async respond(msg: any, options?: MessageOptions): Promise<any> {
        writeToConsole(`${chalk.blue("@atomist")} ${msg}`);
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        writeToConsole("destinations > " + JSON.stringify(msg));
    }

    public async addressChannels(msg: string | SlackMessage, channels: string | string[], options?: MessageOptions): Promise<any> {
        writeToConsole(`#${channels} ${msg}`);
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        writeToConsole(`#${users} ${msg}`);
    }

}
