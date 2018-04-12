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

import { logger } from "@atomist/automation-client";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { Float, Integer } from "@atomist/microgrammar/Primitives";
import { LogInterpreter } from "../../../../../spi/log/InterpretedLog";
import { BuildStatus, TestStatus } from "../../BuildInfo";

export const MavenLogInterpreter: LogInterpreter<MavenStatus> = log => {
    const timingInfo = timingGrammar.firstMatch(log);
    const data: MavenStatus = {
        timeMillis: timingInfo ? timingInfo.seconds * 1000 : undefined,
        success: log.includes("BUILD SUCCESS\----"),
        testInfo: testSummaryGrammar.firstMatch(log) || undefined,
    };
    if (!log) {
        logger.warn("Log was empty");
        return {
            relevantPart: "",
            message: "Failed with empty log",
            includeFullLog: false,
            data,
        };
    }

    const maybeFailedToStart = appFailedToStart(log);
    if (maybeFailedToStart) {
        return {
            relevantPart: maybeFailedToStart,
            message: "Application failed to start",
            includeFullLog: false,
            data,
        };
    }

    // default to maven errors
    const maybeMavenErrors = mavenErrors(log);
    if (maybeMavenErrors) {
        logger.info("Recognized Maven error");
        return {
            relevantPart: maybeMavenErrors,
            message: "Maven errors",
            includeFullLog: false,
            data,
        };
    }

    // or it could be this problem here
    if (log.match(/Error checking out artifact/)) {
        logger.info("Recognized artifact error");
        return {
            relevantPart: log,
            message: "I lost the local cache. Please rebuild",
            includeFullLog: false,
            data,
        };
    }

    logger.info("Did not find anything to recognize in the log");
    return {
        relevantPart: "",
        message: "Unknown error",
        includeFullLog: true,
        data,
    };
};

function appFailedToStart(log: string) {
    const lines = log.split("\n");
    const failedToStartLine = lines.indexOf("APPLICATION FAILED TO START");
    if (failedToStartLine < 1) {
        return undefined;
    }
    const likelyLines = lines.slice(failedToStartLine + 3, failedToStartLine + 10);
    return likelyLines.join("\n");
}

export type MavenStatus = BuildStatus;

function mavenErrors(log: string): string | undefined {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .map(l => l.replace("[ERROR] ", ""))
        .join("\n");
    if (!relevantPart) {
        return;
    }
    return relevantPart;
}

// Microgrammars...

const timingGrammar = Microgrammar.fromString<{ seconds: number }>("Total time: ${seconds} s", {
    seconds: Float,
});

/**
 * Microgrammar for Maven test output
 * @type {Microgrammar<MavenStatus>}
 */
const testSummaryGrammar = Microgrammar.fromString<TestStatus>(
    "Tests run: ${testsRun}, Failures: ${failingTests}, Errors: ${errors}, Skipped: ${pendingTests}",
    {
        testsRun: Integer,
        failingTests: Integer,
        pendingTests: Integer,
        errors: Integer,
    });
