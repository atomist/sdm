
import { SimpleCache } from "./SimpleCache";

/**
 * Simple Map-based cache.
 * Based on https://medium.com/spektrakel-blog/a-simple-lru-cache-in-typescript-cba0d9807c40
 */
export class LruCache<T> implements SimpleCache<T> {

    private requests = 0;
    private cacheHits = 0;

    private values: Map<string, T> = new Map<string, T>();

    constructor(private maxEntries: number = 200) {
    }

    get hits() {
        return this.cacheHits;
    }

    get gets() {
        return this.requests;
    }

    public get(key: string): T {
        ++this.requests;
        const hasKey = this.values.has(key);
        let entry: T;
        if (hasKey) {
            ++this.cacheHits;
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
