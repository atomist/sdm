/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { InterpretedLog } from "../../../../../spi/log/InterpretedLog";

export function interpretMavenLog(log: string): InterpretedLog<MavenInfo> | undefined {
    if (!log) {
        logger.warn("Log was empty");
        return {
            relevantPart: "",
            message: "Failed with empty log",
            includeFullLog: false,
            data: {},
        };
    }

    const mg = Microgrammar.fromString<{ seconds: number }>("Total time: ${seconds} s", {
        seconds: Float,
    });
    const match = mg.firstMatch(log);
    const timing = match ? match.seconds * 1000 : undefined;

    const maybeFailedToStart = appFailedToStart(log);
    if (maybeFailedToStart) {
        return {
            relevantPart: maybeFailedToStart,
            message: "Application failed to start",
            includeFullLog: false,
            data: {
                timeMillis: timing,
            },
        };
    }

    // default to maven errors
    const maybeMavenErrors = mavenErrors(log);
    if (maybeMavenErrors) {
        logger.info("Recognized maven error");
        return {
            relevantPart: maybeMavenErrors,
            message: "Maven errors",
            includeFullLog: false,
            data: {
                timeMillis: timing,
            },
        };
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
    return {
        relevantPart: "",
        message: "Unknown error",
        includeFullLog: true,
        data: {
            timeMillis: timing,
        },
    };
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

import { logger } from "@atomist/automation-client";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { Float } from "@atomist/microgrammar/primitives";

// TODO base on common build info
export interface MavenInfo {

    timeMillis?: number;
}

function mavenErrors(log: string): string | undefined {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .join("\n");
    if (!relevantPart) {
        return;
    }
    return relevantPart;
}
