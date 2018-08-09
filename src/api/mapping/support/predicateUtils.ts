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

import { logger } from "@atomist/automation-client";
import { PredicateMapping } from "../PredicateMapping";
import { DefaultPredicateMappingCostAnalyzer } from "./defaultPredicateMappingCostAnalyzer";
import { ExpectedPredicateMappingCost, PredicateMappingCostAnalyzer } from "./PredicateMappingCostAnalyzer";

/**
 * Return the opposite of this predicate mapping
 */
export function whenNot<F>(t: PredicateMapping<F>): PredicateMapping<F> {
    return {
        name: `not (${t.name})`,
        mapping: async pi => !(await t.mapping(pi)),
    };
}

/**
 * Wrap all these predicates in a single predicate
 * AND: Return true if all are satisfied
 * @param {PredicateMapping} predicates
 * @param analyzer analyzer to use for performance optimization
 * @return {PredicateMapping}
 */
export function all<F>(predicates: Array<PredicateMapping<F>>,
                       analyzer: PredicateMappingCostAnalyzer<F> = DefaultPredicateMappingCostAnalyzer): PredicateMapping<F> {
    return {
        name: predicates.map(g => g.name).join(" && "),
        mapping: async pci => optimizedAndEvaluation(predicates, analyzer)(pci),
    };
}

/**
 * Wrap all these predicates in a single predicate
 * OR: Return true if any is satisfied
 * @param {PredicateMapping} predicates
 * @param analyzer analyzer to use for performance optimization
 * @return {PredicateMapping}
 */
export function any<F>(predicates: Array<PredicateMapping<F>>,
                       analyzer: PredicateMappingCostAnalyzer<F> = DefaultPredicateMappingCostAnalyzer): PredicateMapping<F> {
    return {
        name: predicates.map(g => g.name).join(" || "),
        mapping: async pci => {
            // Cannot short-circuit this
            const allResults: boolean[] = await gatherResults(predicates)(pci);
            return allResults.includes(true);
        },
    };

}

/**
 * Evaluate predicates for an AND, running non-expensive ones first
 * @param {Array<PredicateMapping<F>>} predicates
 * @param {PredicateMappingCostAnalyzer<F>} analyzer
 * @return {(f: F) => Promise<boolean>}
 */
function optimizedAndEvaluation<F>(predicates: Array<PredicateMapping<F>>,
                                   analyzer: PredicateMappingCostAnalyzer<F>): (f: F) => Promise<boolean> {
    const cheap: Array<PredicateMapping<F>> = [];
    const remaining: Array<PredicateMapping<F>> = [];

    for (const p of predicates) {
        const cost = analyzer(p);
        if (cost !== ExpectedPredicateMappingCost.expensive) {
            cheap.push(p);
        } else {
            remaining.push(p);
        }
    }
    logger.debug("Cheap: [%j], remaining: [%j]", cheap, remaining);

    return async pci => {
        const cheapResults = await gatherResults(cheap)(pci);
        if (cheapResults.includes(false)) {
            return false;
        }
        const remainingResults = await gatherResults(remaining)(pci);
        return !remainingResults.includes(false);
    };
}

function gatherResults<F>(predicates: Array<PredicateMapping<F>>): (f: F) => Promise<boolean[]> {
    return pci => {
        return Promise.all(
            predicates.map(async pt => {
                const result = await pt.mapping(pci);
                logger.debug(`Result of PushTest '${pt.name}' was ${result}`);
                return result;
            }),
        );
    };
}
