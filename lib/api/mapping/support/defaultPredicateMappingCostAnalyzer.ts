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

import { logger } from "@atomist/automation-client/lib/util/logger";
import { PredicateMapping } from "../PredicateMapping";
import {
    ExpectedPredicateMappingCost,
    PredicateMappingCostAnalyzer,
} from "./PredicateMappingCostAnalyzer";

/**
 * Indications that evaluating this test may be expensive
 */
const ExpensiveSigns: Array<(pm: PredicateMapping<any>) => boolean> = [
    pm => mappingCodeIncludes(pm, "await "),
    pm => mappingCodeIncludes(pm, ".project"),
    pm => mappingCodeIncludes(pm, ".graphClient"),
    pm => mappingCodeIncludes(pm, ".totalFileCount"),
    pm => mappingCodeIncludes(pm, ".doWithFiles"),
    pm => mappingCodeIncludes(pm, ".getFile", ".findFile"),
    pm => mappingCodeIncludes(pm, ".stream"),
    pm => mappingCodeIncludes(pm, "findMatches", "findFileMatches", "doWithMatches", "doWithFileMatches"),
];

/**
 * Estimate cost by looking at code to see if it goes through a project
 * @param {PredicateMapping<any>} pm
 * @return {any}
 * @constructor
 */
export const DefaultPredicateMappingCostAnalyzer: PredicateMappingCostAnalyzer<any> =
    pm => {
        const mappingCode = pm.mapping.toString();
        if (ExpensiveSigns.some(sign => sign(pm))) {
            logger.debug("Expected cost of [%s] is expensive", mappingCode);
            return ExpectedPredicateMappingCost.expensive;
        }
        logger.debug("Expected cost of [%s] is unknown", mappingCode);
        return ExpectedPredicateMappingCost.unknown;
    };

/**
 * Does the mapping include any of these patterns
 * @param {PredicateMapping<any>} pm
 * @param {string} patterns
 * @return {boolean}
 */
function mappingCodeIncludes(pm: PredicateMapping<any>, ...patterns: string[]): boolean {
    const code = pm.mapping.toString();
    return patterns.some(pattern => code.includes(pattern));
}
