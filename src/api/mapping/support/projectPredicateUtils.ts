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

import { Project } from "@atomist/automation-client/project/Project";
import { PredicateMapping } from "../PredicateMapping";
import { ProjectPredicate } from "../PushTest";
import {
    all,
    any,
} from "./predicateUtils";

/**
 * Return the opposite of this ProjectPredicate
 */
export function notPredicate(t: ProjectPredicate): ProjectPredicate {
    return async pi => !(await t(pi));
}

/**
 * Wrap all these ProjectPredicates in a single ProjectPredicate
 * AND: Return true if all are satisfied
 * @param {ProjectPredicate} predicates
 * @return {ProjectPredicate}
 */
export function allPredicatesSatisfied(...predicates: ProjectPredicate[]): ProjectPredicate {
    return all(predicates.map(toPredicateMapping)).mapping;
}

/**
 * Wrap all these ProjectPredicates in a single ProjectPredicate
 * OR: Return true if any is satisfied
 * @param {ProjectPredicate} predicates
 * @return {ProjectPredicate}
 */
export function anyPredicateSatisfied(...predicates: ProjectPredicate[]): ProjectPredicate {
    return any(predicates.map(toPredicateMapping)).mapping;
}

function toPredicateMapping(p: ProjectPredicate, i: number): PredicateMapping<Project> {
    return {
        name: `p_${i}`,
        mapping: p,
    };
}
