
import { CheckstyleReport, FileReport } from "./CheckstyleReport";

import { promisify } from "util";
import * as xml2js from "xml2js";

export async function extract(report: string): Promise<CheckstyleReport> {
    const parser = new xml2js.Parser();
    const output = await promisify(parser.parseString)(report);
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
