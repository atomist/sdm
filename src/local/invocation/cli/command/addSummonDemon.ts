import { Argv } from "yargs";
import { logExceptionsToConsole, writeToConsole } from "../support/consoleOutput";

import { Destination, MessageOptions } from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";
import * as express from "express";
import { ConsoleMessageClient } from "../io/ConsoleMessageClient";

export const DemonPort = 6660;
export const MessageRoute = "/message";

export function addSummonDemon(yargs: Argv) {
    yargs.command({
        command: "summon-demon",
        describe: "Summon the Atomist listener demon",
        handler: () => {
            return logExceptionsToConsole(() => summonDemon());
        },
    });
}

export interface StreamedMessage {
    message: string | SlackMessage;
    destinations: Destination[];
    options: MessageOptions;
}

async function summonDemon() {
    const messageClient = new ConsoleMessageClient();

    writeToConsole("Your friendly neighborhood demon.\nI am here!");
    const app = express();
    app.use(express.json());

    app.get("/", (req, res) => res.send("Atomist Listener Demon\n"));

    app.post(MessageRoute, async (req, res) => {
        await messageClient.send(req.body.message, req.body.destinations).catch(err => res.sendStatus(500));
        res.send("Read message " + JSON.stringify(req.body) + "\n");
    });

    app.listen(DemonPort,
        () => writeToConsole(`Example app listening on port ${DemonPort}!`));
}
