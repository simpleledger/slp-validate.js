export class CacheMap<T, M> {
    private map = new Map<T, M>();
    private list: T[] = [];
    private maxSize: number;
    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }
    get length(): number {
        return this.list.length;
    }
    public set(key: T, item: M) {
        this.list.push(key);
        this.map.set(key, item);
        if (this.map.size > this.maxSize) {
            this.shift();
        }
    }
    public get(key: T) {
        return this.map.get(key);
    }
    public has(key: T) {
        return this.map.has(key);
    }
    private shift(): T | undefined {
        const key = this.list.shift();
        if (key) {
            this.map.delete(key);
        }
        return key;
    }
    public clear() {
        this.list = [];
        this.map.clear();
    }
}
