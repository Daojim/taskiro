export interface ExtractionResult<T> {
  value?: T;
  matchedText: string;
  confidence: number;
  matchedKeywords?: string[];
}

export abstract class BaseExtractor<T> {
  protected abstract keywords: Record<string, string[]>;
  protected abstract confidenceScores: Record<string, number>;

  abstract extract(text: string): ExtractionResult<T>;

  protected findKeywordMatches(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    const matches: string[] = [];

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        matches.push(keyword);
      }
    }

    return matches;
  }

  protected calculateWeightedScore(matches: string[]): number {
    return matches.reduce((score, keyword) => {
      let weight = 1;
      if (keyword.length > 6) weight = 1.5;
      if (keyword.includes(' ')) weight = 2;
      return score + weight;
    }, 0);
  }
}
