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

import { predicatePushTest, PredicatePushTest } from "../../../api/mapping/PushTest";
import { findDependenciesFromEffectivePom } from "./inspection/findDependencies";
import { findDeclaredDependencies } from "./parse/fromPom";
import { coordinates, dependencyFound, DependencySpecifier } from "./VersionedArtifact";

/**
 * Is this a Maven project
 */
export const IsMaven: PredicatePushTest = predicatePushTest("Is Maven", p => p.hasFile("pom.xml"));

/**
 * Does the project declare the given dependency?
 * @return {PredicatePushTest}
 */
export function hasDeclaredDependency(on: DependencySpecifier): PredicatePushTest {
    return predicatePushTest(`hasDeclaredDep-${coordinates(on)}`, async p => {
        const deps = (await findDeclaredDependencies(p)).dependencies;
        return dependencyFound(on, deps);
    });
}

/**
 * Does the project depend on the given artifact, even indirectly?
 * @return {PredicatePushTest}
 */
export function hasDependency(on: DependencySpecifier): PredicatePushTest {
    return predicatePushTest(`hasDeclaredDep-${coordinates(on)}`, async p => {
        // Attempt an optimization: Look for it in the fast stuff first
        const directDeps = (await findDeclaredDependencies(p)).dependencies;
        const direct = dependencyFound(on, directDeps);
        if (direct) {
            return true;
        }
        // If we're still going, check transient dependencies
        const deps = await findDependenciesFromEffectivePom(p);
        return dependencyFound(on, deps);
    });
}
