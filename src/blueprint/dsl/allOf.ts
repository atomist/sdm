import { PredicateMapping } from "../..";
import { PredicateMappingTerm, toPredicateMapping } from "../../common/listener/support/PredicateMappingTerm";

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
