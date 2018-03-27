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

import { ProjectListenerInvocation } from "./Listener";

export type NeverMatch = null;

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
     * Return NeverMatch (null) to shortcut evaluation of the present set of rules
     * and guarantee the return of undefined.
     * This is a rude thing to do: Only do so if you are sure
     * that this evaluation must be shortcircuited.
     * The value may be static
     * or computed on demand, depending on the implementation.
     * @param {ProjectListenerInvocation} p
     * @return {Promise<V | undefined | NeverMatch>}
     */
    valueForPush(p: ProjectListenerInvocation): Promise<V | undefined | NeverMatch>;
}
