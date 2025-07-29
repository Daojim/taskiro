import { dateParsingService } from '../services/dateParsingService';

describe('Date Disambiguation System', () => {
  // Use a consistent reference date for all tests
  const REFERENCE_DATE = new Date('2024-01-15T10:00:00Z'); // Monday, January 15, 2024

  // Helper function to calculate days difference
  const calculateDaysDifference = (date1: Date, date2: Date): number => {
    return Math.floor(
      (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  describe('generateDisambiguationSuggestions', () => {
    describe('next week disambiguation', () => {
      it('should generate 8 suggestions for "next week" (7-14 days ahead)', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'next week',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(1);
        expect(results[0].type).toBe('date');
        expect(results[0].originalText).toBe('next week');
        expect(results[0].suggestions).toHaveLength(8); // 7 days (7-14 days ahead)
      });

      it('should generate dates exactly 7-14 days ahead for "next week"', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'next week',
          REFERENCE_DATE
        );

        const suggestions = results[0].suggestions;

        suggestions.forEach((suggestion, index) => {
          const date = suggestion.value as Date;
          const daysDiff = calculateDaysDifference(date, REFERENCE_DATE);

          expect(daysDiff).toBe(7 + index); // Should be 7, 8, 9, ..., 14 days ahead
          expect(suggestion.confidence).toBe(0.8);
          expect(suggestion.display).toMatch(
            /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/
          );
        });
      });
    });

    describe('end of month disambiguation', () => {
      it('should generate suggestions for "end of month"', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'end of month',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(1);
        expect(results[0].type).toBe('date');
        expect(results[0].originalText).toBe('end of month');
        expect(results[0].suggestions.length).toBeGreaterThan(0);
      });

      it('should generate suggestions for "end of the month"', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'end of the month',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(1);
        expect(results[0].originalText).toBe('end of the month');
      });

      it('should generate dates within the current month for "end of month"', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'end of month',
          REFERENCE_DATE
        );

        const suggestions = results[0].suggestions;
        const referenceMonth = REFERENCE_DATE.getMonth();
        const referenceYear = REFERENCE_DATE.getFullYear();

        suggestions.forEach((suggestion) => {
          const date = suggestion.value as Date;
          expect(date.getMonth()).toBe(referenceMonth);
          expect(date.getFullYear()).toBe(referenceYear);
          expect(suggestion.confidence).toBe(0.7);
        });
      });
    });

    describe('edge cases', () => {
      it('should return empty array for non-ambiguous date text', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'tomorrow',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(0);
      });

      it('should handle empty input gracefully', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          '',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(0);
      });

      it('should handle case-insensitive matching', () => {
        const results = dateParsingService.generateDisambiguationSuggestions(
          'NEXT WEEK',
          REFERENCE_DATE
        );

        expect(results).toHaveLength(1);
        expect(results[0].originalText).toBe('next week');
      });
    });
  });

  describe('parseInput integration', () => {
    it('should detect ambiguous elements in parseInput', () => {
      const result = dateParsingService.parseInput(
        'meeting next week',
        REFERENCE_DATE
      );

      expect(result.title).toBe('meeting');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.ambiguousElements).toHaveLength(1);
      expect(result.ambiguousElements![0].originalText).toBe('next week');
    });

    it('should handle multiple ambiguous elements', () => {
      const result = dateParsingService.parseInput(
        'meeting next week at end of month',
        REFERENCE_DATE
      );

      expect(result.ambiguousElements).toHaveLength(1); // Only first match is processed
    });
  });
});
