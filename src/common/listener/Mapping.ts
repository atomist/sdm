
export type NeverMatch = null;

/**
 * Result of a Mapper. A result of the desired type if
 * we match. undefined if we don't match.
 * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
 * terminating evaluation and guarantee the return of undefined if we've reached this point.
 * Only do so if you are sure
 */
export type MappingResult<V> = Promise<V | undefined | NeverMatch>;

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
