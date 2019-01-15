/*
 * Copyright © 2019 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client";

/**
 * Creates a PreferenceStore instance provided the HandlerContext of the current execution
 */
export type PreferenceStoreFactory = (ctx: HandlerContext) => PreferenceStore;

/**
 * Scope of a preference
 */
export type PreferenceScope = "sdm" | "workspace";

/**
 * Strategy to store and retrieve SDM preferences.
 */
export interface PreferenceStore {

    /**
     * Retrieve a preference object via its key.
     * The key might get scoped to the current SDM if the options.scoped flag is set to true.
     * @param key
     * @param options
     */
    get<V>(key: string, options?: { scope?: PreferenceScope }): Promise<V | undefined>;

    /**
     * Store a preference object with the specified ttl. If options.scoped is set to true
     * the key preference will be scoped to the current SDM.
     * @param key
     * @param value
     * @param options
     */
    put<V>(key: string, value: V, options?: { ttl?: number, scope?: PreferenceScope }): Promise<V>;
}

/**
 * NoOp PreferenceStore implementation useful for situations in which
 * the SDM does not support preferences or tests.
 */
export const NoPreferenceStore: PreferenceStore = {

    get: async () => undefined,

    put: async (key, value) => value,

}
