import { InterpretedLog } from "../../../../../spi/log/InterpretedLog";

export function interpretMavenLog(log: string): InterpretedLog | undefined {
    if (!log) {
        logger.warn("Log was empty");
        return undefined;
    }

    const maybeFailedToStart = appFailedToStart(log);
    if (maybeFailedToStart) {
        return {
            relevantPart: maybeFailedToStart,
            message: "Application failed to start",
            includeFullLog: false,
        };
    }

    // default to maven errors
    const maybeMavenErrors = mavenErrors(log);
    if (maybeMavenErrors) {
        logger.info("Recognized maven error");
        return maybeMavenErrors;
    }

    // or it could be this problem here
    if (log.match(/Error checking out artifact/)) {
        logger.info("Recognized artifact error");
        return {
            relevantPart: log,
            message: "I lost the local cache. Please rebuild",
            includeFullLog: false,
        };
    }
    logger.info("Did not find anything to recognize in the log");
}


function appFailedToStart(log: string) {
    const lines = log.split("\n");
    const failedToStartLine = lines.indexOf("APPLICATION FAILED TO START");
    if (failedToStartLine < 1) {
        return undefined;
    }
    const likelyLines = lines.slice(failedToStartLine + 3, failedToStartLine + 10);
    return likelyLines.join("\n");
}

import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { Float } from "@atomist/microgrammar/primitives";
import { logger } from "@atomist/automation-client";

// TODO base on common build info
export interface MavenInfo {

    timeMillis?: number;
}

function mavenErrors(log: string): InterpretedLog<MavenInfo> | undefined {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .join("\n");
    if (!relevantPart) {
        return;
    }
    const mg = Microgrammar.fromString<{seconds: number}>("Total time: ${seconds} s", {
        seconds: Float,
    });
    const timing = mg.firstMatch(log);
    return {
        relevantPart,
        message: "Maven log",
        includeFullLog: true,
        data: {
            timeMillis: !!timing ? timing.seconds * 1000 : undefined,
        },
    };
}
