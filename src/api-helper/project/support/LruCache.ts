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

import { SimpleCache } from "./SimpleCache";

/**
 * Simple Map-based cache.
 * Based on https://medium.com/spektrakel-blog/a-simple-lru-cache-in-typescript-cba0d9807c40
 */
export class LruCache<T> implements SimpleCache<T> {

    private gets = 0;
    private hits = 0;

    private readonly values: Map<string, T> = new Map<string, T>();

    constructor(private readonly maxEntries: number = 200) {
    }

    get stats() {
        return {hits: this.hits, gets: this.gets};
    }

    public get(key: string): T {
        ++this.gets;
        const hasKey = this.values.has(key);
        let entry: T;
        if (hasKey) {
            ++this.hits;
            // Peek the entry, re-insert for LRU strategy
            entry = this.values.get(key);
            this.values.delete(key);
            this.values.set(key, entry);
        }
        return entry;
    }

    public put(key: string, value: T) {
        if (this.values.size >= this.maxEntries) {
            // least-recently used cache eviction strategy
            const keyToDelete = this.values.keys().next().value;
            this.values.delete(keyToDelete);
        }
        this.values.set(key, value);
    }

    public evict(key: string) {
        return this.values.delete(key);
    }

}
