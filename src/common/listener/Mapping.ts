/**
 * Compute a value for the given push. Return undefined
 * if we don't find a mapped value.
 * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
 * terminating evaluation and guarantee the return of undefined if we've reached this point.
 * Only do so if you are sure
 * that this evaluation must be short circuited if it has reached this point.
 * If a previous rule has matched, it will still be used.
 * The value may be static
 * or computed on demand, depending on the implementation.
 * @param {PushListenerInvocation} p
 */
import { PushListenerInvocation } from "./PushListener";
import { NeverMatch } from "./PushMapping";

/**
 * Result of a Mapping. A result of the desired type if
 * we match. undefined if we don't match.
 * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
 * terminating evaluation and guarantee the return of undefined if we've reached this point.
 * Only do so if you are sure
 */
export type MappingResult<V> = Promise<V | undefined | NeverMatch>;

export type Mapping<F,V> = (from: F) => MappingResult<V>;

/**
 * Mapping from push to value, id it can be resolved.
 * This is a central interface used throughout the SDM.
 */
export interface XMapping<F, V> {

    /**
     * Name of the PushMapping. Must be unique
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
    valueForPush: Mapping<F, V>;
}
