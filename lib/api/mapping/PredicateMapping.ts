/*
 * Copyright © 2019 Atomist, Inc.
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

import { Mapping } from "./Mapping";

/**
 * Style of logical composition
 */
export enum PredicateMappingCompositionStyle {
    And = "and",
    Or = "or",
    Not = "not",
}

/**
 * Mapping to a boolean
 */
export interface PredicateMapping<F> extends Mapping<F, boolean> {

    /**
     * If this predicate has internal structure,
     * the components and how they are applied.
     * For internal and tooling use.
     */
    readonly structure?: {
        components: Array<PredicateMapping<F>>,
        readonly compositionStyle: PredicateMappingCompositionStyle,
    };
}

/**
 * Implemented by types whose behavior is potentially explicable by a single PredicateMapping
 */
export interface Predicated<F> {

    /**
     * The test for the contribution. Contributions may be
     * applied in various ways.
     */
    test?: PredicateMapping<F>;
}

/**
 * Function that can visit a PredicateMappings.
 * @return whether to visit the mapping's subcomponents, if any
 */
export type PredicateMappingVisitor<F> = (pm: PredicateMapping<F>) => boolean;

/**
 * Visit the PredicateMappings, returning whether to continue
 * @param pm predicate mapping to visit. Always visits root,
 * and any subcomponents as long as the visitor returns true
 * @param v visitor
 * @return {boolean} whether to visit the mapping's structure, if any
 */
export function visitPredicateMappings<F>(pm: PredicateMapping<F>, v: PredicateMappingVisitor<F>): void {
    if (v(pm) && !!pm.structure) {
        pm.structure.components.forEach(n => visitPredicateMappings(n, v));
    }
}
