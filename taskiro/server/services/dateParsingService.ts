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

// Category suggestion keywords - Requirements 4.6, 4.7
const CATEGORY_KEYWORDS = {
  work: [
    'meeting',
    'presentation',
    'report',
    'project',
    'deadline',
    'client',
    'office',
    'conference',
    'email',
    'call',
    'review',
    'proposal',
    'budget',
    'team',
    'manager',
    'colleague',
    'business',
    'professional',
    'work',
    'job',
    'career',
    'interview',
    'resume',
    'salary',
    'promotion',
    'training',
    'workshop',
    'seminar',
  ],
  personal: [
    'grocery',
    'groceries',
    'shopping',
    'doctor',
    'appointment',
    'dentist',
    'gym',
    'exercise',
    'workout',
    'family',
    'friend',
    'birthday',
    'anniversary',
    'vacation',
    'travel',
    'hobby',
    'personal',
    'home',
    'house',
    'cleaning',
    'laundry',
    'cooking',
    'meal',
    'dinner',
    'lunch',
    'breakfast',
    'health',
    'medical',
    'pharmacy',
    'bank',
    'finance',
    'bills',
    'insurance',
    'car',
    'maintenance',
    'repair',
  ],
  school: [
    'assignment',
    'homework',
    'study',
    'exam',
    'test',
    'quiz',
    'class',
    'lecture',
    'professor',
    'teacher',
    'student',
    'school',
    'university',
    'college',
    'course',
    'semester',
    'grade',
    'paper',
    'essay',
    'research',
    'thesis',
    'dissertation',
    'lab',
    'laboratory',
    'textbook',
    'library',
    'campus',
    'tuition',
    'scholarship',
    'degree',
    'major',
    'minor',
    'graduation',
    'academic',
    'education',
  ],
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
  CATEGORY_HIGH: 0.8,
  CATEGORY_MEDIUM: 0.6,
  CATEGORY_LOW: 0.4,
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

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const DATE_FORMAT_OPTIONS = {
  SHORT_DATE: { month: 'short', day: 'numeric' } as const,
  WEEKDAY_LONG: { weekday: 'long' } as const,
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

    // Extract category suggestion based on task content
    const category = this.extractCategorySuggestion(input);
    if (category.category) {
      result.category = category.category;
      result.confidence = Math.max(result.confidence, category.confidence);
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
      result.category ||
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
   * Requirements 2.4, 2.5: Detect ambiguous date expressions that need disambiguation
   */
  private checkForAmbiguousDatePatterns(
    text: string,
    referenceDate: Date
  ): AmbiguousElement | null {
    const lowerText = text.toLowerCase();

    // Check for "next week" patterns - ambiguous, could be any day 7-14 days ahead
    if (lowerText.includes('next week')) {
      const match = text.match(/next week/i);
      if (match) {
        return {
          type: 'date',
          originalText: match[0],
          suggestions: this.generateNextWeekSuggestions(referenceDate),
        };
      }
    }

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
   * Requirements 2.4: Generate date options for "next week" (7-14 days ahead)
   */
  private generateNextWeekSuggestions(referenceDate: Date): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Start from 7 days ahead and go to 14 days ahead
    for (let daysAhead = 7; daysAhead <= 14; daysAhead++) {
      const date = this.addDaysToDate(referenceDate, daysAhead);
      const suggestion = this.createDateSuggestion(
        date,
        CONFIDENCE_SCORES.NEXT_WEEK
      );
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Utility method to add days to a date without mutating the original
   */
  private addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Create a standardized date suggestion object
   */
  private createDateSuggestion(date: Date, confidence: number): Suggestion {
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];

    return {
      value: date,
      display: `${dayName}, ${date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS.SHORT_DATE)}`,
      confidence,
    };
  }

  /**
   * Generate suggestions for "end of month" (last few days)
   * Requirements 2.5: Generate options for "end of month" (last few days)
   */
  private generateEndOfMonthSuggestions(referenceDate: Date): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    // Get last day of current month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = referenceDate.getDate();

    // Generate suggestions for last few days of month (last 3-5 days)
    // Start from 5 days before end of month, but not before today
    const startDay = Math.max(lastDay - 4, today);

    for (let day = startDay; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const suggestion = this.createDateSuggestion(
        date,
        CONFIDENCE_SCORES.END_OF_MONTH
      );
      suggestions.push(suggestion);
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
   * Extract category suggestion based on task content
   * Requirements 4.6, 4.7: Implement category suggestion based on task content
   */
  private extractCategorySuggestion(text: string): {
    category?: string;
    matchedKeywords: string[];
    confidence: number;
  } {
    const lowerText = text.toLowerCase();
    const categoryScores: Record<
      string,
      { score: number; keywords: string[] }
    > = {
      work: { score: 0, keywords: [] },
      personal: { score: 0, keywords: [] },
      school: { score: 0, keywords: [] },
    };

    // Define high-priority keywords that should have stronger influence
    const highPriorityKeywords = {
      work: [
        'meeting',
        'client',
        'project',
        'deadline',
        'presentation',
        'conference',
        'business',
      ],
      personal: [
        'gym',
        'doctor',
        'dentist',
        'family',
        'birthday',
        'groceries',
        'shopping',
      ],
      school: [
        'assignment',
        'exam',
        'lecture',
        'professor',
        'university',
        'homework',
        'lab',
        'thesis',
      ],
    };

    // Check each category's keywords
    for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lowerText)) {
          // Give higher weight to more specific keywords
          let weight = 1;

          // High priority keywords get extra weight
          if (
            highPriorityKeywords[
              categoryName as keyof typeof highPriorityKeywords
            ]?.includes(keyword)
          ) {
            weight = 2.5;
          } else if (keyword.length > 6) {
            weight = 1.5; // Longer, more specific keywords get higher weight
          }

          if (keyword.includes(' ')) weight *= 1.5; // Multi-word keywords get even higher weight

          categoryScores[categoryName].score += weight;
          categoryScores[categoryName].keywords.push(keyword);
        }
      }
    }

    // Find the category with the highest score
    let bestCategory = '';
    let bestScore = 0;
    let bestKeywords: string[] = [];

    for (const [categoryName, data] of Object.entries(categoryScores)) {
      if (data.score > bestScore) {
        bestCategory = categoryName;
        bestScore = data.score;
        bestKeywords = data.keywords;
      }
    }

    // Calculate confidence based on score and keyword quality
    let confidence = 0;
    if (bestScore > 0) {
      if (bestScore >= 3) {
        confidence = CONFIDENCE_SCORES.CATEGORY_HIGH;
      } else if (bestScore >= 2) {
        confidence = CONFIDENCE_SCORES.CATEGORY_MEDIUM;
      } else {
        confidence = CONFIDENCE_SCORES.CATEGORY_LOW;
      }
    }

    return {
      category: bestScore > 0 ? bestCategory : undefined,
      matchedKeywords: bestKeywords,
      confidence,
    };
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

  /**
   * Generate disambiguation suggestions for ambiguous date text
   * Requirements 2.4, 2.5: Provide date options for ambiguous expressions
   */
  public generateDisambiguationSuggestions(
    dateText: string,
    referenceDate: Date = new Date()
  ): AmbiguousElement[] {
    const ambiguousElements: AmbiguousElement[] = [];
    const lowerText = dateText.toLowerCase().trim();

    // Check for "next week" - generate 7-14 days ahead options
    if (lowerText.includes('next week')) {
      ambiguousElements.push({
        type: 'date',
        originalText: 'next week',
        suggestions: this.generateNextWeekSuggestions(referenceDate),
      });
    }

    // Check for "end of month" - generate last few days of month
    if (
      lowerText.includes('end of month') ||
      lowerText.includes('end of the month')
    ) {
      const originalText = lowerText.includes('end of the month')
        ? 'end of the month'
        : 'end of month';
      ambiguousElements.push({
        type: 'date',
        originalText,
        suggestions: this.generateEndOfMonthSuggestions(referenceDate),
      });
    }

    return ambiguousElements;
  }

  /**
   * Get category suggestion for a given text
   * Requirements 4.6, 4.7: Provide category suggestions based on task content
   */
  public getCategorySuggestion(text: string): {
    category?: string;
    matchedKeywords: string[];
    confidence: number;
  } {
    return this.extractCategorySuggestion(text);
  }

  /**
   * Get all available category keywords for reference
   */
  public getCategoryKeywords(): typeof CATEGORY_KEYWORDS {
    return CATEGORY_KEYWORDS;
  }
}

// Export singleton instance
export const dateParsingService = new DateParsingService();
