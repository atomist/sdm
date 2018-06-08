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

export type NeverMatch = null;

/**
 * Result of a Mapper. A result of the desired type if
 * we match. undefined if we don't match.
 * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
 * terminating evaluation and guarantee the return of undefined if we've reached this point.
 * Only do so if you are sure
 */
export type MappingResult<V> = Promise<V | undefined | NeverMatch>;

/**
 * Mapping function from F to V
 */
export type Mapper<F, V> = (from: F) => MappingResult<V>;

/**
 * Mapper from source to value, if it can be resolved.
 * This is a central interface used throughout the SDM.
 */
export interface Mapping<F, V> {

    /**
     * Name of the Mapping. Must be unique
     */
    readonly name: string;

    /**
     * Compute a value for the given event. Return undefined
     * if we don't find a mapped value.
     * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
     * terminating evaluation and guarantee the return of undefined if we've reached this point.
     * Only do so if you are sure
     * that this evaluation must be short circuited if it has reached this point.
     * If a previous rule has matched, it will still be used.
     * The value may be static
     * or computed on demand, depending on the implementation.
     */
    mapping: Mapper<F, V>;
}

export function isMapping(a: any): a is Mapping<any, any> {
    const maybe = a as Mapping<any, any>;
    return !!maybe.name && !!maybe.mapping;
}
