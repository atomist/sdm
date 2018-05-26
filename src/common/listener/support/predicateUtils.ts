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
 * @return {PredicateMapping}
 */
export function all<F>(...predicates: Array<PredicateMapping<F>>): PredicateMapping<F> {
    return {
        name: predicates.map(g => g.name).join(" && "),
        mapping: async pci => {
            const allResults: boolean[] = await Promise.all(
                predicates.map(async pt => {
                    const result = await pt.mapping(pci);
                    logger.debug(`Result of PushTest '${pt.name}' was ${result}`);
                    return result;
                }),
            );
            return !allResults.includes(false);
        },
    };
}

/**
 * Wrap all these predicates in a single predicate
 * OR: Return true if any is satisfied
 * @param {PredicateMapping} predicates
 * @return {PredicateMapping}
 */
export function any<F>(...predicates: Array<PredicateMapping<F>>): PredicateMapping<F> {
    return {
        name: predicates.map(g => g.name).join(" || "),
        mapping: async pci => {
            const allResults: boolean[] = await Promise.all(
                predicates.map(async pt => {
                    const result = await pt.mapping(pci);
                    logger.debug(`Result of PushTest '${pt.name}' was ${result}`);
                    return result;
                }),
            );
            return allResults.includes(true);
        },
    };

}
