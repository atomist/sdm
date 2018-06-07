import { logger } from "@atomist/automation-client";
import { sprintf } from "sprintf-js";

// tslint:disable-next-line:no-var-requires
const chalk = require("chalk");

export function setCommandLineLogging() {
    // Relies on being Winston logging
    (logger as any).transports.console.silent = true;
}

export interface ConsoleWriteOptions {
    message: string;
    color: "cyan" | "red" | "redBright" | "blue" | "green" | "gray" | "yellow";
}

export function writeToConsole(msg: string | ConsoleWriteOptions, ...args: any[]) {
    const expanded = typeof msg === "string" ?
        sprintf(msg, ...args) :
        chalk[msg.color](sprintf(msg.message, ...args));
    process.stdout.write(expanded + "\n");
}

export async function logExceptionsToConsole(what: () => Promise<any>) {
    try {
        await what();
    } catch (err) {
        writeToConsole({message: `Error: ${err.message}`, color: "red"});
        logger.error(`Error: ${err.message}`);
        process.exit(1);
    }
}
