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

import { promisify } from "util";
import * as xml2js from "xml2js";
import { ProjectIdentifier } from "../projectIdentifier";
import { VersionedArtifact } from "./VersionedArtifact";

export const MavenProjectIdentifier: ProjectIdentifier = async p => {
    const pom = await p.getFile("pom.xml");
    if (!pom) {
        return undefined;
    }
    const content = await pom.getContent();
    const ident = await identification(content);
    return { name: ident.artifact, version: ident.version };
};

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
