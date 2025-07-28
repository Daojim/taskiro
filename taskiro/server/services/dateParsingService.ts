import * as chrono from 'chrono-node';
import { ParsedInput, AmbiguousElement, Suggestion } from '../types/nlp';

// Constants for better maintainability
const PRIORITY_KEYWORDS = {
  high: [
    'urgent',
    'important',
    'asap',
    'critical',
    'major',
    'high priority',
    'emergency',
  ],
  medium: ['medium', 'normal', 'regular'],
  low: ['low', 'minor', 'whenever', 'low priority', 'optional'],
} as const;

const CONFIDENCE_SCORES = {
  BASE: 0.5,
  YEAR_BONUS: 0.2,
  MONTH_BONUS: 0.2,
  DAY_BONUS: 0.2,
  HOUR_BONUS: 0.1,
  MINUTE_BONUS: 0.1,
  PRIORITY_HIGH: 0.8,
  PRIORITY_MEDIUM: 0.7,
  PRIORITY_LOW: 0.8,
  AMBIGUOUS_DATE: 0.6,
  NEXT_WEEK: 0.8,
  END_OF_MONTH: 0.7,
  MINIMUM: 0.3,
} as const;

const DATE_PATTERNS = {
  END_OF_MONTH: /(end of (?:the )?month)/gi,
  NEXT_WEEK: /next week/i,
  TIME_FORMAT: /^(\d{1,2}):(\d{2})$/,
  TITLE_CLEANUP: /\s+/g,
  LEADING_TRAILING_CLEANUP: /^[,\s\-:]+|[,\s\-:]+$/g,
  PREPOSITION_CLEANUP: /^(by|for|at)\s+/gi,
} as const;

export class DateParsingService {
  /**
   * Parse natural language input to extract task information
   */
  public parseInput(
    input: string,
    referenceDate: Date = new Date()
  ): ParsedInput {
    const result: ParsedInput = {
      title: input,
      confidence: 0,
      ambiguousElements: [],
    };

    let workingTitle = input;

    // Extract priority first (before date parsing to avoid conflicts)
    const priority = this.extractPriority(input);
    if (priority.priority) {
      result.priority = priority.priority;
      workingTitle = workingTitle
        .replace(new RegExp(priority.matchedText, 'gi'), '')
        .trim();
      result.confidence = Math.max(result.confidence, priority.confidence);
    }

    // Check for special ambiguous date patterns first
    const ambiguousDate = this.checkForAmbiguousDatePatterns(
      workingTitle,
      referenceDate
    );
    if (ambiguousDate) {
      result.ambiguousElements?.push(ambiguousDate);
      // For ambiguous dates, don't set a specific date but increase confidence
      result.confidence = Math.max(
        result.confidence,
        CONFIDENCE_SCORES.AMBIGUOUS_DATE
      );
      workingTitle = workingTitle
        .replace(new RegExp(ambiguousDate.originalText, 'gi'), '')
        .trim();
    } else {
      // Parse dates using chrono-node only if no ambiguous patterns found
      const dateResults = chrono.parse(workingTitle, referenceDate);

      if (dateResults.length > 0) {
        const dateResult = dateResults[0];
        result.dueDate = dateResult.start.date();

        // Extract time if available
        if (
          dateResult.start.isCertain('hour') &&
          dateResult.start.isCertain('minute')
        ) {
          const hours = dateResult.start.get('hour');
          const minutes = dateResult.start.get('minute');
          if (hours !== null && minutes !== null) {
            result.dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }

        // Remove the date text from the title
        workingTitle = workingTitle.replace(dateResult.text, '').trim();

        // Calculate confidence based on date parsing certainty
        result.confidence = Math.max(
          result.confidence,
          this.calculateDateConfidence(dateResult)
        );

        // Check for ambiguous date expressions in the parsed text
        const ambiguousDateFromParsed = this.checkForAmbiguousDate(
          dateResult.text,
          referenceDate
        );
        if (ambiguousDateFromParsed) {
          result.ambiguousElements?.push(ambiguousDateFromParsed);
        }
      }
    }

    // Clean up title
    result.title = this.cleanTitle(workingTitle);

    // Set minimum confidence if we found something
    if (
      result.dueDate ||
      result.priority ||
      (result.ambiguousElements && result.ambiguousElements.length > 0)
    ) {
      result.confidence = Math.max(
        result.confidence,
        CONFIDENCE_SCORES.MINIMUM
      );
    }

    return result;
  }

  /**
   * Calculate confidence score for date parsing
   */
  private calculateDateConfidence(dateResult: chrono.ParsedResult): number {
    let confidence = CONFIDENCE_SCORES.BASE;

    // Higher confidence for specific dates
    if (dateResult.start.isCertain('year'))
      confidence += CONFIDENCE_SCORES.YEAR_BONUS;
    if (dateResult.start.isCertain('month'))
      confidence += CONFIDENCE_SCORES.MONTH_BONUS;
    if (dateResult.start.isCertain('day'))
      confidence += CONFIDENCE_SCORES.DAY_BONUS;
    if (dateResult.start.isCertain('hour'))
      confidence += CONFIDENCE_SCORES.HOUR_BONUS;
    if (dateResult.start.isCertain('minute'))
      confidence += CONFIDENCE_SCORES.MINUTE_BONUS;

    return Math.min(confidence, 1.0);
  }

  /**
   * Check for ambiguous date patterns before chrono parsing
   */
  private checkForAmbiguousDatePatterns(
    text: string,
    referenceDate: Date
  ): AmbiguousElement | null {
    const lowerText = text.toLowerCase();

    // Check for "end of month" patterns
    if (
      lowerText.includes('end of month') ||
      lowerText.includes('end of the month')
    ) {
      const match = text.match(DATE_PATTERNS.END_OF_MONTH);
      if (match) {
        return {
          type: 'date',
          originalText: match[0],
          suggestions: this.generateEndOfMonthSuggestions(referenceDate),
        };
      }
    }

    return null;
  }

  /**
   * Check for ambiguous date expressions that need disambiguation
   */
  private checkForAmbiguousDate(
    dateText: string,
    referenceDate: Date
  ): AmbiguousElement | null {
    // Check for "next week" - ambiguous, could be any day next week
    if (DATE_PATTERNS.NEXT_WEEK.test(dateText)) {
      return {
        type: 'date',
        originalText: dateText,
        suggestions: this.generateNextWeekSuggestions(referenceDate),
      };
    }

    return null;
  }

  /**
   * Generate suggestions for "next week" (7-14 days ahead)
   */
  private generateNextWeekSuggestions(referenceDate: Date): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const startOfNextWeek = new Date(referenceDate);

    // Find next Monday (start of next week)
    const daysUntilNextMonday = (8 - startOfNextWeek.getDay()) % 7 || 7;
    startOfNextWeek.setDate(startOfNextWeek.getDate() + daysUntilNextMonday);

    const dayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfNextWeek);
      date.setDate(date.getDate() + i);

      suggestions.push({
        value: date,
        display: `${dayNames[i]}, ${date.toLocaleDateString()}`,
        confidence: CONFIDENCE_SCORES.NEXT_WEEK,
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions for "end of month" (last few days)
   */
  private generateEndOfMonthSuggestions(referenceDate: Date): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    // Get last day of current month
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Generate suggestions for last 5 days of month
    for (let day = lastDay - 4; day <= lastDay; day++) {
      if (day > 0) {
        const date = new Date(year, month, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        suggestions.push({
          value: date,
          display: `${dayName}, ${date.toLocaleDateString()}`,
          confidence: CONFIDENCE_SCORES.END_OF_MONTH,
        });
      }
    }

    return suggestions;
  }

  /**
   * Extract priority from text
   */
  private extractPriority(text: string): {
    priority?: 'low' | 'medium' | 'high';
    matchedText: string;
    confidence: number;
  } {
    // Check high priority keywords
    for (const keyword of PRIORITY_KEYWORDS.high) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        return {
          priority: 'high',
          matchedText: keyword,
          confidence: CONFIDENCE_SCORES.PRIORITY_HIGH,
        };
      }
    }

    // Check low priority keywords
    for (const keyword of PRIORITY_KEYWORDS.low) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        return {
          priority: 'low',
          matchedText: keyword,
          confidence: CONFIDENCE_SCORES.PRIORITY_LOW,
        };
      }
    }

    // Check medium priority keywords
    for (const keyword of PRIORITY_KEYWORDS.medium) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        return {
          priority: 'medium',
          matchedText: keyword,
          confidence: CONFIDENCE_SCORES.PRIORITY_MEDIUM,
        };
      }
    }

    return { matchedText: '', confidence: 0 };
  }

  /**
   * Clean up the extracted title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(DATE_PATTERNS.TITLE_CLEANUP, ' ') // Replace multiple spaces with single space
      .replace(DATE_PATTERNS.LEADING_TRAILING_CLEANUP, '') // Remove leading/trailing commas, spaces, dashes, colons
      .replace(DATE_PATTERNS.PREPOSITION_CLEANUP, '') // Remove common prepositions at start
      .trim();
  }

  /**
   * Handle relative dates like "tomorrow", "next Tuesday", "in two weeks"
   */
  public parseRelativeDate(
    dateText: string,
    referenceDate: Date = new Date()
  ): Date | null {
    const results = chrono.parse(dateText, referenceDate);
    return results.length > 0 ? results[0].start.date() : null;
  }

  /**
   * Format time for Google Calendar compatibility (HH:MM format)
   */
  public formatTimeForCalendar(time: string): string {
    // Ensure time is in HH:MM format
    const match = time.match(DATE_PATTERNS.TIME_FORMAT);

    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    return time; // Return as-is if already valid or invalid
  }

  /**
   * Get confidence score for a parsed result
   */
  public getConfidenceScore(parsed: ParsedInput): number {
    return parsed.confidence;
  }
}

// Export singleton instance
export const dateParsingService = new DateParsingService();
