import { logger } from "@atomist/automation-client";
import { PredicateMapping } from "../PredicateMapping";
import { ExpectedPredicateMappingCost, PredicateMappingCostAnalyzer } from "./PredicateMappingCostAnalyzer";

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
            logger.info("Expected cost of [%s] is expensive", mappingCode);
            return ExpectedPredicateMappingCost.expensive;
        }
        logger.info("Expected cost of [%s] is unknown", mappingCode);
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
