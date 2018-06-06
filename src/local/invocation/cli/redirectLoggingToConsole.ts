import { logger } from "@atomist/automation-client";
import { formatter } from "@atomist/automation-client/internal/util/logger";
import { sprintf } from "sprintf-js";
import * as winston from "winston";

const winstonLogger = new winston.Logger({
    level: "debug",
    // handleExceptions: true,
    // humanReadableUnhandledException: true,
    exitOnError: false,
    transports: [
        new (winston.transports.Console)({
            level: "info",
            json: false,
            colorize: require("chalk").supportsColor,
            prettyPrint: true,
            timestamp: true,
            showLevel: true,
            align: true,
            stderrLevels: ["error"],
            formatter,
            // handleExceptions: true,
            // humanReadableUnhandledException: true,
        }),
    ],
});

export function redirectLoggingToConsole() {
    logger.log = (level: string, msg: string, ...meta: any[]) => {
        switch (level) {
            case "info":
                const expanded = sprintf(msg, ...meta);
                process.stdout.write(expanded + "\n");
                return logger;

            case "warn":
                const expanded0 = sprintf(msg, ...meta);
                process.stderr.write(expanded0 + "\n");
                return logger;

            case "error":
                const expanded2 = sprintf(msg, ...meta);
                process.stderr.write(expanded2 + "\n");
                return logger;

            case "debug" :
                winstonLogger.debug(msg, meta);
                return logger;

            default:
                process.stderr.write("Unknown log level: " + level);
        }
    };

}
