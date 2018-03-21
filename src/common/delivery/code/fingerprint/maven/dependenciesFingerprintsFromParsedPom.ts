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

import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { computeShaOf } from "../../../../../util/misc/sha";
import {
    coordinates,
    toVersionedArtifact,
} from "../../../build/local/maven/artifact";

/**
 * Don't call except via mavenFingerprinter
 * @param epom xml2js parsed form
 * @return {Promise<Fingerprint>}
 */
export async function dependenciesFingerprintsFromParsedPom(epom: any): Promise<Fingerprint> {
    const dependencies: VersionedArtifact[] =
        epom.project.dependencies[0].dependency.map(toVersionedArtifact);
    const sorted = dependencies
        .sort((d1, d2) => coordinates(d1) > coordinates(d2) ? 1 : -1);
    const json = JSON.stringify(sorted);
    return {
        name: "dependencies",
        abbreviation: "deps",
        version: "0.1",
        sha: computeShaOf(json),
        data: json,
    };
}
