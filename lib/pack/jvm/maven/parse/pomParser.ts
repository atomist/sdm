/*
 * Copyright © 2020 Atomist, Inc.
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

import { Project } from "@atomist/automation-client/lib/project/Project";
import { gather } from "@atomist/automation-client/lib/tree/ast/astUtils";
import { ProjectIdentification } from "../../../../core/delivery/build/local/projectIdentifier";
import { XmldocFileParser, XmldocTreeNode } from "../../xml/XmldocFileParser";
import { VersionedArtifact } from "../VersionedArtifact";
import { extractVersionedArtifact } from "./fromPom";

/**
 * Return the identification of a project: name and version
 * @param {Project} p
 * @return {Promise<any>}
 * @constructor
 */
export const MavenProjectIdentifier: (p: Project) => Promise<VersionedArtifact & ProjectIdentification> = async p => {
    const ids = await gather(p, {
        parseWith: new XmldocFileParser(),
        globPatterns: "pom.xml",
        pathExpression: "//project",
        mapper: m => extractVersionedArtifact((m as any) as XmldocTreeNode),
    });
    if (ids.length !== 1) {
        return undefined;
    }
    return ids[0];
};
