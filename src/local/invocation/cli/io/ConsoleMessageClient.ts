import {
    Destination, isSlackMessage,
    MessageClient,
    MessageOptions,
    SlackDestination,
    SlackMessageClient,
} from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";
import { isArray } from "util";
import { writeToConsole } from "../support/consoleOutput";

import { logger } from "@atomist/automation-client";
import { toStringArray } from "@atomist/automation-client/internal/util/string";
import * as _ from "lodash";
import * as marked from "marked";
import { isSdmGoal } from "../../../../ingesters/sdmGoalIngester";

import * as TerminalRenderer from "marked-terminal";

marked.setOptions({
    // Define custom renderer
    renderer: new TerminalRenderer(),
});

// tslint:disable-next-line:no-var-requires
const chalk = require("chalk");

export class ConsoleMessageClient implements MessageClient, SlackMessageClient {

    public async respond(msg: string | SlackMessage, options?: MessageOptions): Promise<any> {
        return this.addressChannels(msg, "general", options);
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        if (isSdmGoal(msg)) {
            logger.info("Storing SDM goal or ingester payload %j", msg);
            writeToConsole({ message: `Stored goal '${msg.name}'`, color: "cyan"});
            return;
        }

        const dests: SlackDestination[] =
            (isArray(destinations) ? destinations : [destinations] as any)
                .filter(a => a.userAgent !== "ingester");
        return this.addressChannels(
            msg,
            _.flatten(dests.map(d => d.channels)),
            options);
    }

    public async addressChannels(msg: string | SlackMessage, channels: string | string[], options?: MessageOptions): Promise<any> {
        const chans = toStringArray(channels);

        const m = isSlackMessage(msg) ? msg.text : msg;
        chans.forEach(channel => {
            writeToConsole(chalk.green("#") + marked(` **${channel}** ` + m));
        });
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        writeToConsole(`#${users} ${msg}`);
    }

}
