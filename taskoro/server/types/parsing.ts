import { AmbiguousElement } from './nlp';

export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'personal' | 'school';

export interface PriorityExtractionResult {
  priority?: Priority;
  matchedText: string;
  confidence: number;
}

export interface CategoryExtractionResult {
  category?: Category;
  matchedKeywords: string[];
  confidence: number;
}

export interface DateExtractionResult {
  date?: Date;
  time?: string;
  confidence: number;
  ambiguousElements: AmbiguousElement[];
}

export interface ParsingContext {
  referenceDate: Date;
  userPreferences?: {
    defaultCategory?: Category;
    timeZone?: string;
    dateFormat?: string;
  };
}

// Validation functions
export const isValidPriority = (value: unknown): value is Priority => {
  return typeof value === 'string' && ['low', 'medium', 'high'].includes(value);
};

export const isValidCategory = (value: unknown): value is Category => {
  return (
    typeof value === 'string' && ['work', 'personal', 'school'].includes(value)
  );
};

export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};
