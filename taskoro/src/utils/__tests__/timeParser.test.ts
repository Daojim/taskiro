import {
  parseTime,
  validateTime,
  formatTimeForDisplay,
  getAutoCompleteSuggestions,
} from '../timeParser';

describe('Time Parser Functions', () => {
  describe('24-hour format parsing', () => {
    test('should parse standard 24-hour format', () => {
      const result = parseTime('14:30');
      expect(result.success).toBe(true);
      expect(result.time).toBe('14:30');
      expect(result.displayTime).toBe('2:30 PM');
    });

    test('should parse 24-hour format with leading zeros', () => {
      const result = parseTime('09:05');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:05');
      expect(result.displayTime).toBe('9:05 AM');
    });

    test('should parse midnight in 24-hour format', () => {
      const result = parseTime('00:00');
      expect(result.success).toBe(true);
      expect(result.time).toBe('00:00');
      expect(result.displayTime).toBe('12:00 AM');
    });

    test('should parse noon in 24-hour format', () => {
      const result = parseTime('12:00');
      expect(result.success).toBe(true);
      expect(result.time).toBe('12:00');
      expect(result.displayTime).toBe('12:00 PM');
    });

    test('should reject invalid 24-hour times', () => {
      expect(parseTime('25:00').success).toBe(false);
      expect(parseTime('12:60').success).toBe(false);
      expect(parseTime('24:30').success).toBe(false);
    });
  });

  describe('12-hour format parsing', () => {
    test('should parse 12-hour format with AM', () => {
      const result = parseTime('9:30 AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:30');
      expect(result.displayTime).toBe('9:30 AM');
    });

    test('should parse 12-hour format with PM', () => {
      const result = parseTime('2:45 PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('14:45');
      expect(result.displayTime).toBe('2:45 PM');
    });

    test('should parse 12-hour format without space', () => {
      const result = parseTime('11:15AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('11:15');
      expect(result.displayTime).toBe('11:15 AM');
    });

    test('should parse 12 AM as midnight', () => {
      const result = parseTime('12:00 AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('00:00');
      expect(result.displayTime).toBe('12:00 AM');
    });

    test('should parse 12 PM as noon', () => {
      const result = parseTime('12:00 PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('12:00');
      expect(result.displayTime).toBe('12:00 PM');
    });

    test('should handle case insensitive AM/PM', () => {
      expect(parseTime('3:00 am').time).toBe('03:00');
      expect(parseTime('3:00 PM').time).toBe('15:00');
      expect(parseTime('3:00 Am').time).toBe('03:00');
      expect(parseTime('3:00 pM').time).toBe('15:00');
    });

    test('should reject invalid 12-hour times', () => {
      expect(parseTime('13:00 AM').success).toBe(false);
      expect(parseTime('0:30 PM').success).toBe(false);
      expect(parseTime('12:60 AM').success).toBe(false);
    });
  });

  describe('hour-only format parsing', () => {
    test('should parse hour-only with AM', () => {
      const result = parseTime('9 AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:00');
      expect(result.displayTime).toBe('9:00 AM');
    });

    test('should parse hour-only with PM', () => {
      const result = parseTime('3 PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('15:00');
      expect(result.displayTime).toBe('3:00 PM');
    });

    test('should parse hour-only without space', () => {
      const result = parseTime('7AM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('07:00');
      expect(result.displayTime).toBe('7:00 AM');
    });
  });

  describe('compact format parsing', () => {
    test('should parse 4-digit compact format', () => {
      const result = parseTime('1430');
      expect(result.success).toBe(true);
      expect(result.time).toBe('14:30');
      expect(result.displayTime).toBe('2:30 PM');
    });

    test('should parse 3-digit compact format', () => {
      const result = parseTime('930');
      expect(result.success).toBe(true);
      expect(result.time).toBe('09:30');
      expect(result.displayTime).toBe('9:30 AM');
    });

    test('should parse compact format with AM/PM', () => {
      const result = parseTime('230PM');
      expect(result.success).toBe(true);
      expect(result.time).toBe('14:30');
      expect(result.displayTime).toBe('2:30 PM');
    });
  });

  describe('natural language parsing', () => {
    test('should parse "noon"', () => {
      const result = parseTime('noon');
      expect(result.success).toBe(true);
      expect(result.time).toBe('12:00');
      expect(result.displayTime).toBe('12:00 PM');
    });

    test('should parse "midnight"', () => {
      const result = parseTime('midnight');
      expect(result.success).toBe(true);
      expect(result.time).toBe('00:00');
      expect(result.displayTime).toBe('12:00 AM');
    });

    test('should handle case insensitive natural language', () => {
      expect(parseTime('NOON').time).toBe('12:00');
      expect(parseTime('Midnight').time).toBe('00:00');
    });
  });

  describe('error handling and suggestions', () => {
    test('should provide suggestions for invalid input', () => {
      const result = parseTime('25:00');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    test('should provide suggestions for partial input', () => {
      const result = parseTime('9');
      expect(result.success).toBe(false);
      expect(result.suggestions).toContain('9:00 AM');
      expect(result.suggestions).toContain('9:00 PM');
    });

    test('should handle empty input', () => {
      const result = parseTime('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a time');
      expect(result.suggestions).toBeDefined();
    });

    test('should handle null/undefined input', () => {
      expect(parseTime(null as any).success).toBe(false);
      expect(parseTime(undefined as any).success).toBe(false);
    });
  });

  describe('validation function', () => {
    test('should validate correct time formats', () => {
      expect(validateTime('14:30').isValid).toBe(true);
      expect(validateTime('9:00 AM').isValid).toBe(true);
      expect(validateTime('noon').isValid).toBe(true);
    });

    test('should invalidate incorrect formats', () => {
      const result = validateTime('25:00');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('display formatting', () => {
    test('should format 24-hour time for display', () => {
      expect(formatTimeForDisplay('14:30')).toBe('2:30 PM');
      expect(formatTimeForDisplay('09:15')).toBe('9:15 AM');
      expect(formatTimeForDisplay('00:00')).toBe('12:00 AM');
      expect(formatTimeForDisplay('12:00')).toBe('12:00 PM');
    });

    test('should handle invalid input gracefully', () => {
      expect(formatTimeForDisplay('')).toBe('');
      expect(formatTimeForDisplay('invalid')).toBe('invalid');
    });
  });

  describe('auto-complete suggestions', () => {
    test('should provide suggestions for empty input', () => {
      const suggestions = getAutoCompleteSuggestions('');
      expect(suggestions).toContain('9:00 AM');
      expect(suggestions).toContain('12:00 PM');
    });

    test('should provide suggestions for partial hour', () => {
      const suggestions = getAutoCompleteSuggestions('9');
      expect(suggestions).toContain('9:00 AM');
      expect(suggestions).toContain('9:00 PM');
      expect(suggestions).toContain('09:00');
    });

    test('should provide suggestions for hour with colon', () => {
      const suggestions = getAutoCompleteSuggestions('9:');
      expect(suggestions).toContain('9:00 AM');
      expect(suggestions).toContain('9:15 AM');
      expect(suggestions).toContain('9:30 AM');
    });

    test('should provide natural language suggestions', () => {
      expect(getAutoCompleteSuggestions('no')).toContain('noon');
      expect(getAutoCompleteSuggestions('mid')).toContain('midnight');
    });
  });

  describe('edge cases', () => {
    test('should handle whitespace', () => {
      expect(parseTime('  14:30  ').time).toBe('14:30');
      expect(parseTime('\t9:00 AM\n').time).toBe('09:00');
    });

    test('should handle single digit hours and minutes', () => {
      expect(parseTime('9:5').success).toBe(false); // Invalid format
      expect(parseTime('9:05').time).toBe('09:05'); // Valid format
    });

    test('should handle boundary times', () => {
      expect(parseTime('23:59').time).toBe('23:59');
      expect(parseTime('00:01').time).toBe('00:01');
      expect(parseTime('12:59 AM').time).toBe('00:59');
      expect(parseTime('12:01 PM').time).toBe('12:01');
    });
  });
});
