import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";

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

/**
 * Creates a PreferenceStore instance provided the HandlerContext of the current execution
 */
export type PreferenceStoreFactory = (ctx: HandlerContext) => PreferenceStore;

/**
 * Scope of a preference
 */
export enum PreferenceScope {
    Sdm = "sdm",
    Workspace = "workspace",
}

/**
 * Strategy to store and retrieve SDM preferences.
 */
export interface PreferenceStore {

    /**
     * Retrieve a preference object via its key in the given scope.
     */
    get<V>(key: string,
           options?: { scope?: PreferenceScope | string, defaultValue?: V }): Promise<V | undefined>;

    /**
     * Store a preference object with the specified ttl and scope.
     */
    put<V>(key: string,
           value: V,
           options?: { scope?: PreferenceScope | string, ttl?: number }): Promise<V>;

    /**
     * List all preferences in a given scope
     */
    list<V>(scope: PreferenceScope | string): Promise<Array<{ key: string, value: V }>>;

    /**
     * Delete a preference in a given scope
     */
    delete(key: string,
           options?: { scope?: PreferenceScope | string }): Promise<void>;
}

/**
 * NoOp PreferenceStore implementation useful for situations in which
 * the SDM does not support preferences or tests.
 */
export const NoPreferenceStore: PreferenceStore = {

    get: async () => undefined,

    put: async (key, value) => value,

    list: async () => [],

    delete: async () => {
    },

};
