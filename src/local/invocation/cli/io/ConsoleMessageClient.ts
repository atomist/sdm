import {
    Destination,
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
import { isSdmGoal } from "../../../../ingesters/sdmGoalIngester";

// tslint:disable-next-line:no-var-requires
const chalk = require("chalk");

export class ConsoleMessageClient implements MessageClient, SlackMessageClient {

    public async respond(msg: any, options?: MessageOptions): Promise<any> {
        writeToConsole(`${chalk.blue("@atomist")} ${chalk.yellow(msg)}`);
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
        chans.forEach(channel => {
            writeToConsole(chalk.white(`# ${channel} `) + chalk.green(msg));
        });
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        writeToConsole(`#${users} ${msg}`);
    }

}
