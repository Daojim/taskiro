import { dateParsingService } from '../services/dateParsingService';

describe('Category Extraction', () => {
  describe('extractCategorySuggestion', () => {
    test('should suggest "work" category for work-related keywords', () => {
      const workTexts = [
        'Meeting with client tomorrow',
        'Finish the project report',
        'Prepare presentation for team',
        'Review budget proposal',
        'Call manager about deadline',
        'Submit expense report',
        'Attend conference next week',
        'Schedule interview with candidate',
      ];

      workTexts.forEach((text) => {
        const result = dateParsingService.getCategorySuggestion(text);
        expect(result.category).toBe('work');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
      });
    });

    test('should suggest "personal" category for personal-related keywords', () => {
      const personalTexts = [
        'Buy groceries for dinner',
        'Doctor appointment at 3pm',
        'Go to the gym after work',
        'Family birthday party',
        'Clean the house this weekend',
        'Pay bills before due date',
        'Car maintenance check',
        'Visit dentist for checkup',
      ];

      personalTexts.forEach((text) => {
        const result = dateParsingService.getCategorySuggestion(text);
        expect(result.category).toBe('personal');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
      });
    });

    test('should suggest "school" category for school-related keywords', () => {
      const schoolTexts = [
        'Submit assignment by Friday',
        'Study for exam next week',
        'Attend lecture at university',
        'Meet with professor about thesis',
        'Complete homework for class',
        'Research paper due tomorrow',
        'Lab report submission',
        'Register for next semester courses',
      ];

      schoolTexts.forEach((text) => {
        const result = dateParsingService.getCategorySuggestion(text);
        expect(result.category).toBe('school');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
      });
    });

    test('should return higher confidence for multiple keyword matches', () => {
      const singleKeyword = 'Meeting tomorrow';
      const multipleKeywords = 'Meeting with client about project deadline';

      const singleResult =
        dateParsingService.getCategorySuggestion(singleKeyword);
      const multipleResult =
        dateParsingService.getCategorySuggestion(multipleKeywords);

      expect(multipleResult.confidence).toBeGreaterThan(
        singleResult.confidence
      );
      expect(multipleResult.matchedKeywords.length).toBeGreaterThan(
        singleResult.matchedKeywords.length
      );
    });

    test('should return no category for generic text without keywords', () => {
      const genericTexts = [
        'Do something tomorrow',
        'Remember to check this',
        'Important task for later',
        'Random activity next week',
      ];

      genericTexts.forEach((text) => {
        const result = dateParsingService.getCategorySuggestion(text);
        expect(result.category).toBeUndefined();
        expect(result.confidence).toBe(0);
        expect(result.matchedKeywords.length).toBe(0);
      });
    });

    test('should handle case-insensitive matching', () => {
      const testCases = [
        'MEETING WITH CLIENT',
        'meeting with client',
        'Meeting With Client',
        'MeEtInG wItH cLiEnT',
      ];

      testCases.forEach((text) => {
        const result = dateParsingService.getCategorySuggestion(text);
        expect(result.category).toBe('work');
        expect(result.matchedKeywords).toContain('meeting');
        expect(result.matchedKeywords).toContain('client');
      });
    });

    test('should prioritize category with most keyword matches', () => {
      // Text with both work and personal keywords, but more work keywords
      const workDominant =
        'Meeting with client about project while shopping for groceries';
      const result = dateParsingService.getCategorySuggestion(workDominant);

      expect(result.category).toBe('work');
      expect(result.matchedKeywords).toContain('meeting');
      expect(result.matchedKeywords).toContain('client');
      expect(result.matchedKeywords).toContain('project');
    });
  });

  describe('parseInput with category extraction', () => {
    test('should extract category along with other information', () => {
      const testCases = [
        {
          input: 'Meeting with client tomorrow at 2pm',
          expectedCategory: 'work',
        },
        {
          input: 'Buy groceries after work on Friday',
          expectedCategory: 'personal',
        },
        {
          input: 'Submit assignment by next Tuesday',
          expectedCategory: 'school',
        },
        {
          input: 'Urgent presentation for team meeting',
          expectedCategory: 'work',
          expectedPriority: 'high',
        },
      ];

      testCases.forEach(({ input, expectedCategory, expectedPriority }) => {
        const result = dateParsingService.parseInput(input);

        expect(result.category).toBe(expectedCategory);
        expect(result.confidence).toBeGreaterThan(0);

        if (expectedPriority) {
          expect(result.priority).toBe(expectedPriority);
        }
      });
    });

    test('should maintain title after category extraction', () => {
      const input = 'Meeting with client about project deadline';
      const result = dateParsingService.parseInput(input);

      expect(result.category).toBe('work');
      expect(result.title).toBe('Meeting with client about project deadline');
      expect(result.title.length).toBeGreaterThan(0);
    });

    test('should work with date parsing and category extraction together', () => {
      const input = 'Doctor appointment tomorrow at 3pm';
      const result = dateParsingService.parseInput(input);

      expect(result.category).toBe('personal');
      expect(result.dueDate).toBeDefined();
      expect(result.dueTime).toBe('15:00');
      expect(result.title).toContain('Doctor appointment');
    });
  });

  describe('getCategoryKeywords', () => {
    test('should return all category keywords', () => {
      const keywords = dateParsingService.getCategoryKeywords();

      expect(keywords).toHaveProperty('work');
      expect(keywords).toHaveProperty('personal');
      expect(keywords).toHaveProperty('school');

      expect(Array.isArray(keywords.work)).toBe(true);
      expect(Array.isArray(keywords.personal)).toBe(true);
      expect(Array.isArray(keywords.school)).toBe(true);

      expect(keywords.work.length).toBeGreaterThan(0);
      expect(keywords.personal.length).toBeGreaterThan(0);
      expect(keywords.school.length).toBeGreaterThan(0);
    });
  });
});
