/**
 * Cached regex patterns for better performance
 */
export class RegexCache {
  private static cache = new Map<string, RegExp>();

  static getWordBoundaryRegex(keyword: string, flags = 'i'): RegExp {
    const cacheKey = `wb_${keyword}_${flags}`;

    if (!this.cache.has(cacheKey)) {
      this.cache.set(
        cacheKey,
        new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, flags)
      );
    }

    return this.cache.get(cacheKey)!;
  }

  static getPatternRegex(pattern: string, flags = 'gi'): RegExp {
    const cacheKey = `pat_${pattern}_${flags}`;

    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, new RegExp(pattern, flags));
    }

    return this.cache.get(cacheKey)!;
  }

  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static clearCache(): void {
    this.cache.clear();
  }
}
