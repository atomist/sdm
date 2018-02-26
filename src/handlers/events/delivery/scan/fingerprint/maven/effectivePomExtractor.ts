
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { promisify } from "util";
import * as xml2js from "xml2js";

const XmlFile = "effective-pom.xml";

export async function extractEffectivePom(p: LocalProject): Promise<any> {
    try {
        await runCommand(`mvn help:effective-pom -Doutput=${XmlFile}`, {cwd: p.baseDir});
        const f = await p.findFile(XmlFile);
        const xml = await f.getContent();
        const parser = new xml2js.Parser();
        const parsed = await promisify(parser.parseString)(xml);
        return parsed;
    } catch (err) {
        throw err;
    }
}
