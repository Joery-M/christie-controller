export class Cache {
    private cache = new Map<string, [number, any]>();
    constructor() {}

    get<T>(key: string): T | null {
        const [exp, item] = this.cache.get(key);
        if (exp < Date.now()) return null;
    }
}
