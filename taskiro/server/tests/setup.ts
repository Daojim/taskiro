/**
 * Jest test setup file
 * This file runs before each test suite
 */

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout
jest.setTimeout(10000);

// Mock Date.now() for consistent testing
const MOCK_DATE = new Date('2024-01-15T10:00:00Z');
const originalDateNow = Date.now;

beforeEach(() => {
  // Reset Date.now mock before each test
  Date.now = jest.fn(() => MOCK_DATE.getTime());
});

afterEach(() => {
  // Restore Date.now after each test
  Date.now = originalDateNow;
  jest.clearAllMocks();
});

export { MOCK_DATE };
