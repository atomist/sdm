
import { CheckstyleReport, FileReport } from "./CheckstyleReport";

import {logger} from "@atomist/automation-client";
import { promisify } from "util";
import * as xml2js from "xml2js";

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
