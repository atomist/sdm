
import { PredicateMapping } from "../PredicateMapping";

/**
 * Classification of expected PredicateMapping cost
 */
export enum ExpectedPredicateMappingCost {
    cheap = "cheap",
    expensive = "expensive",
    unknown = "unknown",
}

/**
 * Function that can classify PredicateMappings by expected cost to evaluate
 */
export type PredicateMappingCostAnalyzer<F> = (pm: PredicateMapping<F>) => ExpectedPredicateMappingCost;
