/**
 * Simple memoization utility for caching expensive operations
 */
export class MemoizationCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private readonly ttl: number;

  constructor(ttlMs = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Decorator for memoizing method results
export function memoize<T>(ttlMs?: number) {
  const cache = new MemoizationCache<T>(ttlMs);

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached;
      }

      const result = method.apply(this, args);
      cache.set(key, result);
      return result;
    };
  };
}
