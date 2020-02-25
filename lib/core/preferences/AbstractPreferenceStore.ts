/*
 * Copyright © 2020 Atomist, Inc.
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

import {
    ConfigurationAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import {
    PreferenceScope,
    PreferenceStore,
} from "../../api/context/preferenceStore";

export interface Preference {
    name: string;
    namespace: string;
    value: string;
    ttl: number;
}

/**
 * Abstract PreferenceStore implementation to handle ttl and key scoping
 */
export abstract class AbstractPreferenceStore implements PreferenceStore {

    protected constructor(private readonly ctx: HandlerContext) {
    }

    public async get<V>(key: string,
                        options: { scope?: PreferenceScope | string, defaultValue?: V } = {}): Promise<V | undefined> {
        const pref = await this.doGet(key, this.scope(options.scope));
        const defaultValue = !!options ? options.defaultValue : undefined;
        if (!pref) {
            return defaultValue;
        }
        if (!!pref.ttl && pref.ttl < Date.now()) {
            return defaultValue;
        } else {
            return JSON.parse(pref.value) as V;
        }
    }

    public async put<V>(key: string,
                        value: V,
                        options: { scope?: PreferenceScope | string, ttl?: number } = {}): Promise<V> {
        const pref: Preference = {
            name: key,
            namespace: this.scope(options.scope),
            value: JSON.stringify(value),
            ttl: options.ttl,
        };
        await this.doPut(pref);
        return value;
    }

    public async list<V>(scope: PreferenceScope | string): Promise<Array<{ key: string; value: V }>> {
        const prefs = await this.doList(this.scope(scope));
        if (!prefs) {
            return [];
        } else {
            const values: Array<{ key: string, value: V }> = prefs.map(pref => {
                if (!!pref.ttl && pref.ttl < Date.now()) {
                    return undefined;
                } else {
                    return { key: pref.name, value: JSON.parse(pref.value) as V };
                }
            });
            return values.filter(v => !!v);
        }
    }

    public async delete(key: string, options: { scope?: PreferenceScope | string } = {}): Promise<void> {
        return this.doDelete(key, this.scope(options.scope));
    }

    protected abstract doGet(key: string, namespace: string): Promise<Preference | undefined>;

    protected abstract doPut(pref: Preference): Promise<void>;

    protected abstract doList(namespace: string): Promise<Preference[]>;

    protected abstract doDelete(key: string, namespace: string): Promise<void>;

    protected scopeKey(key: string, scope?: string): string {
        if (!!scope && scope.length > 0) {
            return `${scope}_$_${key}`;
        }
        return key;
    }

    protected scope(scope: PreferenceScope | string): string {
        if (!!scope) {
            switch (scope) {
                case PreferenceScope.Sdm:
                    return (this.ctx as any as ConfigurationAware).configuration.name;
                case PreferenceScope.Workspace:
                    return "";
                default:
                    return scope;
            }
        }
        return "";
    }
}
