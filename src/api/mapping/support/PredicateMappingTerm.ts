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

import { isMapping, Mapper } from "../Mapping";
import { PredicateMapping } from "../PredicateMapping";

/**
 * Predicate that can be used in predicate DSL.
 * Can be a PredicateMapping, a function or computed boolean
 */
export type PredicateMappingTerm<F> =
    PredicateMapping<F> |
    Mapper<F, boolean> |
    (() => (boolean | Promise<boolean>));

/**
 * Convert a PredicateMapping term to a PredicateMapping
 * @param {PredicateMappingTerm<F>} p
 * @return {PredicateMapping<F>}
 */
export function toPredicateMapping<F>(p: PredicateMappingTerm<F>): PredicateMapping<F> {
    if (isMapping(p)) {
        return p;
    }
    return {name: p + "", mapping: p as any};
}
