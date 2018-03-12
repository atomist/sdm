import { promisify } from "util";
import * as xml2js from "xml2js";
import { VersionedArtifact } from "./VersionedArtifact";

/**
 * Return version info from the POM using xml2j XML parser
 * @param {string} pom
 * @return {Promise<VersionedArtifact>}
 */
export function identification(pom: string): Promise<VersionedArtifact> {
    const parser = new xml2js.Parser();
    return promisify(parser.parseString)(pom)
        .then((parsed: any) => {
            if (!!parsed.project) {
                return {
                    group: parsed.project.groupId[0],
                    artifact: parsed.project.artifactId[0],
                    version: parsed.project.version[0],
                };
            } else {
                return Promise.reject("Pom is invalid");
            }
        });
}
