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

/**
 * Specify consistent naming for dependencies
 */
export interface DependencySpecifier {

    group?: string;

    artifact?: string;

    version?: string;
}

export interface VersionedArtifact extends DependencySpecifier {

    group: string;

    artifact: string;

    version: string;

    scope?: string;

    description?: string;

}

/**
 * Return a unique artifact string
 * @param va
 */
export function coordinates(va: DependencySpecifier): string {
    let coords = `${va.group}:${va.artifact}`;
    if (va.version) {
        coords += `:${va.version}`;
    }
    return coords;
}

/**
 * Is there a match for the given dependency specifier in these dependencies?
 * @param {DependencySpecifier} searchTerm
 * @param {VersionedArtifact[]} dependencies
 * @return {boolean}
 */
export function dependencyFound(searchTerm: DependencySpecifier, dependencies: VersionedArtifact[]): boolean {
    let deps = dependencies;
    if (!!searchTerm.group) {
        deps = deps.filter(d => d.group === searchTerm.group);
    }
    if (!!searchTerm.artifact) {
        deps = deps.filter(d => d.artifact === searchTerm.artifact);
    }
    if (!!searchTerm.version) {
        deps = deps.filter(d => d.version === searchTerm.version);
    }
    return deps.length > 0;
}
