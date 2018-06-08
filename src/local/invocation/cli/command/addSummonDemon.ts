import { Argv } from "yargs";
import { sdm } from "../../machine";
import { logExceptionsToConsole, writeToConsole } from "../support/consoleOutput";

import * as express from "express";

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

async function summonDemon() {
    writeToConsole("Your friendly neighborhood demon.\nI am here!");
    const app = express();

    app.get("/", (req, res) => res.send("Atomist Listener Demon"));

    app.post(MessageRoute, (req, res) => {
        res.send("Read message " + JSON.stringify(req.body));
    });

    app.listen(DemonPort,
        () => writeToConsole(`Example app listening on port ${DemonPort}!`));
}
