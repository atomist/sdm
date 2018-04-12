/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PushListenerInvocation } from "./PushListener";

export type NeverMatch = null;

/**
 * Constant to indicate we should never match
 * @type {any}
 */
export const DoNotSetAnyGoals: NeverMatch = null;

/**
 * Mapping from push to value, it it can be resolved.
 */
export interface PushMapping<V> {

    /**
     * Name of the PushMapping. Must be unique
     */
    readonly name: string;

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
     * @return {Promise<V | undefined | NeverMatch>}
     */
    valueForPush(p: PushListenerInvocation): Promise<V | undefined | NeverMatch>;
}

export function isPushMapping(a: any): a is PushMapping<any> {
    const maybe = a as PushMapping<any>;
    return !!maybe.name && !!maybe.valueForPush;
}
