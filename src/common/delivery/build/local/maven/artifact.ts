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

import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";

export function coordinates(va: VersionedArtifact): string {
    let coords = `${va.groupId}:${va.artifactId}`;
    if (va.version) {
        coords += `:${va.version}`;
    }
    return coords;
}

/**
 * Convert Maven POM XML parser format to our VersionedArtifact
 * @param raw
 * @return {VersionedArtifact}
 */
export function toVersionedArtifact(raw: any): VersionedArtifact {
    return {
        groupId: raw.groupId[0],
        artifactId: raw.artifactId[0],
        version: raw.version[0],
        description: !!raw.description ? raw.description[0] : undefined,
    };
}
