/**
 * Jest test setup file
 * This file runs before each test suite
 */

// Global test timeout
jest.setTimeout(10000);

// Mock Date.now() for consistent testing
const MOCK_DATE = new Date('2025-07-27T10:00:00Z');

beforeEach(() => {
  // Reset Date.now mock before each test
  jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE.getTime());
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

export { MOCK_DATE };
