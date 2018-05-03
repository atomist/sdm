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

import { logger } from "@atomist/automation-client";
import { promisify } from "util";
import * as xml2js from "xml2js";
import {
    CheckstyleReport,
    FileReport,
} from "./CheckstyleReport";

export async function extract(report: string): Promise<CheckstyleReport> {
    if (report === undefined || report === null) {
        throw new Error("checkstyle report is null or undefined");
    }
    if (report === "") {
        // great
        return {
            files: [],
        };
    }
    const parser = new xml2js.Parser();
    const output = await promisify(parser.parseString)(report);
    if (!output) {
        logger.warn(`Report: <${report}>`);
        throw new Error("Unable to parse checkstyle report.");
    }
    const raw = output.checkstyle;
    return {
        files: raw.file.map(fileToFile),
    };
}

function fileToFile(f: any): FileReport {
    return {
        name: f.$.name,
        errors: f.error.map(e => e.$),
    };
}
