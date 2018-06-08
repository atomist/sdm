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

import { PredicateMapping } from "../mapping/PredicateMapping";
import { PredicateMappingTerm, toPredicateMapping } from "../mapping/support/PredicateMappingTerm";

/**
 * Predicate mapping DSL method. Allows use of booleans and functions
 * returning boolean in predicate expressions
 * @param {PushTest} pred1
 * @param {PushTest} preds
 */
export function allOf<F>(
    pred1: PredicateMappingTerm<F>,
    ...preds: Array<PredicateMappingTerm<F>>): PredicateMapping<F> {
    const asPredicateMappings = [toPredicateMapping<F>(pred1)].concat(preds.map(toPredicateMapping));
    return {
        name: asPredicateMappings.map(c => c.name).join(" & "),
        mapping: async pu => {
            const result = await Promise.all(asPredicateMappings.map(pm => pm.mapping(pu)));
            return !result.includes(false);
        },
    };
}
