import debug from "debug";

const log = debug("christie:cache");

export class ResultCache {
    private cache = new Map<string, [number, Promise<any>]>();
    constructor(
        private defaultTTL: number,
        private disabled = false,
    ) {}

    get<T>(key: string): Promise<T> | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const [exp, item] = entry;
        if (exp < Date.now()) {
            log("Key", key, "expired");
            return null;
        } else {
            log("Returning cached key", key);
            return item;
        }
    }

    /**
     * @param ttl TTL in seconds
     */
    store<T>(key: string, value: Promise<T>, ttl: number = this.defaultTTL): Promise<T> {
        if (this.disabled) return value;

        log("Storing", key, "with TTL", ttl);
        const exp = Date.now() + ttl * 1000;
        this.cache.set(key, [exp, value]);
        return value;
    }

    invalidate(key: string): void {
        log("invalidated key", key);
        this.cache.delete(key);
    }
}
