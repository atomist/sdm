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

import { Mapping } from "./Mapping";

/**
 * Style of logical composition
 */
export enum CompositionStyle {
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
        readonly compositionStyle: CompositionStyle,
    }
}

/**
 * Function that can visit a PredicateMappings.
 * @return whether to visit the mapping's subcomponents, if any
 */
export type PredicateMappingVisitor<F> = (pm: PredicateMapping<F>) => boolean;

/**
 * Visit the node, returning whether to continue
 * @param pm predicate mapping to visit
 * @param v visitor
 * @return {boolean} whether to visit the mapping's structure, if any
 */
export function visitPredicateMappings<F>(pm: PredicateMapping<F>, v: PredicateMappingVisitor<F>) {
    if (v(pm) && !!pm.structure) {
        pm.structure.components.forEach(n => visitPredicateMappings(n, v));
    }
}
