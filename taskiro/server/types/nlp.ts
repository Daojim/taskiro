export type Priority = 'low' | 'medium' | 'high';
export type AmbiguousElementType = 'date' | 'time' | 'priority' | 'category';

export interface ParsedInput {
  title: string;
  dueDate?: Date;
  dueTime?: string; // Should be in HH:MM format
  priority?: Priority;
  category?: string;
  confidence: number; // Should be between 0 and 1
  ambiguousElements?: AmbiguousElement[];
}

export interface AmbiguousElement {
  type: AmbiguousElementType;
  originalText: string;
  suggestions: Suggestion[];
}

export interface Suggestion {
  value: string | Date;
  display: string;
  confidence: number; // Should be between 0 and 1
}

export interface ParseRequest {
  input: string;
  referenceDate?: string; // ISO string for API compatibility
  userId?: string; // For context-aware parsing
}

export interface ParseResponse {
  parsed: ParsedInput;
  success: boolean;
  error?: string;
}

// Additional types for better API responses
export interface DisambiguationResponse {
  success: boolean;
  ambiguousElements: AmbiguousElement[];
  error?: string;
}

export interface RelativeDateResponse {
  success: boolean;
  parsedDate: Date | null;
  originalText: string;
  error?: string;
}

// Type guards for runtime validation
export function isPriority(value: string): value is Priority {
  return ['low', 'medium', 'high'].includes(value);
}

export function isValidConfidence(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Validation utilities
export function validateParsedInput(input: ParsedInput): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  }

  if (!isValidConfidence(input.confidence)) {
    errors.push('Confidence must be between 0 and 1');
  }

  if (input.dueTime && !isValidTimeFormat(input.dueTime)) {
    errors.push('Due time must be in HH:MM format');
  }

  if (input.priority && !isPriority(input.priority)) {
    errors.push('Priority must be low, medium, or high');
  }

  return errors;
}

// Constants for better maintainability
export const NLP_CONSTANTS = {
  MAX_INPUT_LENGTH: 1000,
  MIN_INPUT_LENGTH: 1,
  MAX_DATE_TEXT_LENGTH: 100,
  MIN_DATE_TEXT_LENGTH: 1,
  DEFAULT_CONFIDENCE: 0.3,
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4,
} as const;
