/**
 * Robust time parsing utility that supports multiple time formats
 * Addresses requirements 3.2 and 3.5 for enhanced time input system
 */

export interface TimeParseResult {
  success: boolean;
  time?: string; // HH:MM format (24-hour)
  displayTime?: string; // Formatted for display (12-hour with AM/PM)
  error?: string;
  suggestions?: string[];
}

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export class TimeParser {
  // Supported time formats with regex patterns
  private static readonly TIME_PATTERNS = [
    // 24-hour formats
    { pattern: /^([01]?\d|2[0-3]):([0-5]\d)$/, format: '24h', name: 'HH:MM' },
    { pattern: /^([01]?\d|2[0-3])([0-5]\d)$/, format: '24h', name: 'HHMM' },

    // 12-hour formats with AM/PM
    {
      pattern: /^(1[0-2]|0?[1-9]):([0-5]\d)\s*(am|pm)$/i,
      format: '12h',
      name: 'H:MM AM/PM',
    },
    {
      pattern: /^(1[0-2]|0?[1-9]):([0-5]\d)(am|pm)$/i,
      format: '12h',
      name: 'H:MMAM/PM',
    },
    {
      pattern: /^(1[0-2]|0?[1-9])\s*(am|pm)$/i,
      format: '12h-hour',
      name: 'H AM/PM',
    },

    // Compact formats
    {
      pattern: /^([01]?\d|2[0-3])([0-5]\d)$/,
      format: '24h-compact',
      name: 'HHMM',
    },
    {
      pattern: /^(1[0-2]|0?[1-9])([0-5]\d)(am|pm)$/i,
      format: '12h-compact',
      name: 'HMMAM/PM',
    },

    // Natural language patterns
    { pattern: /^noon$/i, format: 'natural', name: 'noon' },
    { pattern: /^midnight$/i, format: 'natural', name: 'midnight' },
  ];

  /**
   * Parse time input and return standardized format
   */
  static parseTime(input: string): TimeParseResult {
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        error: 'Please enter a time',
        suggestions: ['09:00', '2:30 PM', '14:30'],
      };
    }

    const trimmedInput = input.trim();

    // Handle natural language
    if (trimmedInput.toLowerCase() === 'noon') {
      return {
        success: true,
        time: '12:00',
        displayTime: '12:00 PM',
      };
    }

    if (trimmedInput.toLowerCase() === 'midnight') {
      return {
        success: true,
        time: '00:00',
        displayTime: '12:00 AM',
      };
    }

    // Try each pattern
    for (const { pattern, format } of this.TIME_PATTERNS) {
      const match = trimmedInput.match(pattern);
      if (match) {
        try {
          const result = this.processMatch(match, format);
          if (result.success) {
            return result;
          }
        } catch (error) {
          continue; // Try next pattern
        }
      }
    }

    // If no pattern matches, provide helpful suggestions
    return {
      success: false,
      error: 'Invalid time format',
      suggestions: this.generateSuggestions(trimmedInput),
    };
  }

  /**
   * Process regex match based on format type
   */
  private static processMatch(
    match: RegExpMatchArray,
    format: string
  ): TimeParseResult {
    switch (format) {
      case '24h':
        return this.process24Hour(match);
      case '12h':
        return this.process12Hour(match);
      case '12h-hour':
        return this.process12HourOnly(match);
      case '24h-compact':
        return this.process24HourCompact(match);
      case '12h-compact':
        return this.process12HourCompact(match);
      default:
        return { success: false, error: 'Unknown format' };
    }
  }

  /**
   * Process 24-hour format (HH:MM)
   */
  private static process24Hour(match: RegExpMatchArray): TimeParseResult {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours > 23 || minutes > 59) {
      return { success: false, error: 'Invalid time values' };
    }

    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const displayTime = this.formatDisplayTime(hours, minutes);

    return {
      success: true,
      time,
      displayTime,
    };
  }

  /**
   * Process 12-hour format with AM/PM
   */
  private static process12Hour(match: RegExpMatchArray): TimeParseResult {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toLowerCase();

    if (hours < 1 || hours > 12 || minutes > 59) {
      return { success: false, error: 'Invalid time values' };
    }

    let hour24 = hours;
    if (period === 'am' && hours === 12) {
      hour24 = 0;
    } else if (period === 'pm' && hours !== 12) {
      hour24 = hours + 12;
    }

    const time = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const displayTime = `${hours}:${minutes.toString().padStart(2, '0')} ${period.toUpperCase()}`;

    return {
      success: true,
      time,
      displayTime,
    };
  }

  /**
   * Process 12-hour format with only hour and AM/PM
   */
  private static process12HourOnly(match: RegExpMatchArray): TimeParseResult {
    const hours = parseInt(match[1], 10);
    const period = match[2].toLowerCase();

    if (hours < 1 || hours > 12) {
      return { success: false, error: 'Invalid hour value' };
    }

    let hour24 = hours;
    if (period === 'am' && hours === 12) {
      hour24 = 0;
    } else if (period === 'pm' && hours !== 12) {
      hour24 = hours + 12;
    }

    const time = `${hour24.toString().padStart(2, '0')}:00`;
    const displayTime = `${hours}:00 ${period.toUpperCase()}`;

    return {
      success: true,
      time,
      displayTime,
    };
  }

  /**
   * Process 24-hour compact format (HHMM)
   */
  private static process24HourCompact(
    match: RegExpMatchArray
  ): TimeParseResult {
    const timeStr = match[0];
    if (timeStr.length === 3) {
      // HMM format (e.g., 930 = 9:30)
      const hours = parseInt(timeStr[0], 10);
      const minutes = parseInt(timeStr.slice(1), 10);
      return this.process24Hour([
        timeStr,
        hours.toString(),
        minutes.toString(),
      ]);
    } else if (timeStr.length === 4) {
      // HHMM format (e.g., 0930 = 9:30)
      const hours = parseInt(timeStr.slice(0, 2), 10);
      const minutes = parseInt(timeStr.slice(2), 10);
      return this.process24Hour([
        timeStr,
        hours.toString(),
        minutes.toString(),
      ]);
    }

    return { success: false, error: 'Invalid compact format' };
  }

  /**
   * Process 12-hour compact format (HMMAM/PM)
   */
  private static process12HourCompact(
    match: RegExpMatchArray
  ): TimeParseResult {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toLowerCase();

    return this.process12Hour([
      match[0],
      hours.toString(),
      minutes.toString(),
      period,
    ]);
  }

  /**
   * Format time for display (12-hour with AM/PM)
   */
  private static formatDisplayTime(hours: number, minutes: number): string {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Generate helpful suggestions based on input
   */
  private static generateSuggestions(input: string): string[] {
    const suggestions: string[] = [];

    // Extract numbers from input
    const numbers = input.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const firstNum = parseInt(numbers[0], 10);

      // Suggest common formats
      if (firstNum >= 1 && firstNum <= 12) {
        suggestions.push(`${firstNum}:00 AM`, `${firstNum}:00 PM`);
        if (numbers.length > 1) {
          const secondNum = parseInt(numbers[1], 10);
          if (secondNum <= 59) {
            suggestions.push(
              `${firstNum}:${secondNum.toString().padStart(2, '0')} AM`
            );
            suggestions.push(
              `${firstNum}:${secondNum.toString().padStart(2, '0')} PM`
            );
          }
        }
      }

      if (firstNum >= 0 && firstNum <= 23) {
        suggestions.push(`${firstNum.toString().padStart(2, '0')}:00`);
        if (numbers.length > 1) {
          const secondNum = parseInt(numbers[1], 10);
          if (secondNum <= 59) {
            suggestions.push(
              `${firstNum.toString().padStart(2, '0')}:${secondNum.toString().padStart(2, '0')}`
            );
          }
        }
      }
    }

    // Add common times if no specific suggestions
    if (suggestions.length === 0) {
      suggestions.push('9:00 AM', '2:30 PM', '14:30', '18:00');
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Validate time input without parsing
   */
  static validateTime(input: string): TimeValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        error: 'Time is required',
        suggestion: 'Try formats like "9:00 AM" or "14:30"',
      };
    }

    const result = this.parseTime(input);
    return {
      isValid: result.success,
      error: result.error,
      suggestion: result.suggestions?.[0],
    };
  }

  /**
   * Format time from HH:MM to display format
   */
  static formatTimeForDisplay(time: string): string {
    if (!time || !time.includes(':')) {
      return time;
    }

    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return time;
    }

    return this.formatDisplayTime(hours, minutes);
  }

  /**
   * Convert display format back to HH:MM
   */
  static parseDisplayTime(displayTime: string): string {
    const result = this.parseTime(displayTime);
    return result.success ? result.time! : '';
  }

  /**
   * Get auto-completion suggestions for partial input
   */
  static getAutoCompleteSuggestions(input: string): string[] {
    if (!input) {
      return ['9:00 AM', '12:00 PM', '2:30 PM', '6:00 PM'];
    }

    const trimmed = input.trim().toLowerCase();
    const suggestions: string[] = [];

    // Handle partial hour input
    if (/^\d{1,2}$/.test(trimmed)) {
      const hour = parseInt(trimmed, 10);
      if (hour >= 1 && hour <= 12) {
        suggestions.push(
          `${hour}:00 AM`,
          `${hour}:00 PM`,
          `${hour}:30 AM`,
          `${hour}:30 PM`
        );
      }
      if (hour >= 0 && hour <= 23) {
        suggestions.push(
          `${hour.toString().padStart(2, '0')}:00`,
          `${hour.toString().padStart(2, '0')}:30`
        );
      }
    }

    // Handle partial time with colon
    if (/^\d{1,2}:$/.test(trimmed)) {
      const hour = parseInt(trimmed.slice(0, -1), 10);
      if (hour >= 1 && hour <= 12) {
        suggestions.push(
          `${hour}:00 AM`,
          `${hour}:00 PM`,
          `${hour}:15 AM`,
          `${hour}:30 AM`,
          `${hour}:45 AM`
        );
      }
      if (hour >= 0 && hour <= 23) {
        suggestions.push(
          `${hour.toString().padStart(2, '0')}:00`,
          `${hour.toString().padStart(2, '0')}:15`,
          `${hour.toString().padStart(2, '0')}:30`,
          `${hour.toString().padStart(2, '0')}:45`
        );
      }
    }

    // Handle natural language starts
    if ('noon'.startsWith(trimmed)) {
      suggestions.push('noon');
    }
    if ('midnight'.startsWith(trimmed)) {
      suggestions.push('midnight');
    }

    return suggestions.slice(0, 6); // Limit suggestions
  }
}

/**
 * Convenience functions for common use cases
 */

export const parseTime = (input: string): TimeParseResult =>
  TimeParser.parseTime(input);
export const validateTime = (input: string): TimeValidationResult =>
  TimeParser.validateTime(input);
export const formatTimeForDisplay = (time: string): string =>
  TimeParser.formatTimeForDisplay(time);
export const getAutoCompleteSuggestions = (input: string): string[] =>
  TimeParser.getAutoCompleteSuggestions(input);
