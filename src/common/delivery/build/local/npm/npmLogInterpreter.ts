/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LogInterpreter } from "../../../../../spi/log/InterpretedLog";
import { logger } from "@atomist/automation-client";

export const NpmLogInterpreter: LogInterpreter = log => {
    if (!log) {
        return undefined;
    }
    const lines = stripLogPrefix(removeNpmFooter(log.split("\n")));

    const defaultMessage = lastOccurrenceOf(/^ERROR:/, lines) || "Error";
    const defaultLines = lines.slice(-15);

    const recognizedInterpretation: RecognizedLog = recognizeMochaTest(lines) || {};

    const relevantLines: string[] = recognizedInterpretation.relevantLines || defaultLines;

    return {
        message: recognizedInterpretation.message || defaultMessage,
        relevantPart: relevantLines.join("\n"),
    };
};

const LogPrefix = /^.*\[(info |error|warn |debug)\] /;
const NpmFooterPrefix = /^npm ERR!/;
const StackTraceLine = /^\W*at /;
const BeginMochaFailingTests = /^\W*\d* failing$/;

type RecognizedLog = { message?: string, relevantLines?: string[] };

function recognizeMochaTest(lines: string[]): RecognizedLog {
    const begin = lines.findIndex(s => BeginMochaFailingTests.test(s));
    if (begin < 0) {
        logger.debug("No mocha test detected");
        return;
    }
    logger.debug("Mocha test detected, beginning at %d: %s", begin, lines[begin]);
    const fromBeginning = lines.slice(begin);
    const end = findTwoBlankLinesIndex(fromBeginning) || fromBeginning.length;

    const fromFailingCountToTwoBlankLines = fromBeginning.slice(0, end);
    return {
        message: "Tests: " + lines[begin].trim(),
        relevantLines: fromFailingCountToTwoBlankLines.filter(s => !StackTraceLine.test(s))
    };
}

function stripLogPrefix(lines: string[]): string[] {
    return lines.map(s => s.replace(LogPrefix, ""))
}

function removeNpmFooter(lines: string[]) {
    if (lines.includes("npm ERR! This is probably not a problem with npm. There is likely additional logging output above.")) {
        logger.info("Filtering npm error footer");
        return lines.filter(s => !NpmFooterPrefix.test(s))
    }
    return lines;
}

function findTwoBlankLinesIndex(lines: string[]) {
    return lines.findIndex((s, i) => s === "" && lines[i + 1] === "");
}

function lastOccurrenceOf(re: RegExp, lines: string[]) {
    const reversedLines = lines.slice().reverse(); // is there a better way tto make a copy? reverse() is in-place. >:-(
    return reversedLines.find(s => re.test(s));
}