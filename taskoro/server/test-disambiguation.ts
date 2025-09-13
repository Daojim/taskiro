#!/usr/bin/env tsx

import { dateParsingService } from './services/dateParsingService';

/**
 * Manual test runner for date disambiguation system
 * This file provides a quick way to test the disambiguation functionality
 * For proper unit tests, see tests/dateDisambiguation.test.ts
 */

const REFERENCE_DATE = new Date('2024-01-15T10:00:00Z'); // Monday, January 15, 2024

// Test configuration
const TEST_CASES = {
  nextWeek: 'next week',
  endOfMonth: 'end of month',
  endOfTheMonth: 'end of the month',
  integration: 'meeting next week',
} as const;

/**
 * Utility function to calculate days difference
 */
function calculateDaysDifference(date1: Date, date2: Date): number {
  return Math.floor(
    (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Test next week disambiguation
 */
function testNextWeekDisambiguation(): void {
  console.log('=== Test 1: Next Week Disambiguation ===');

  const results = dateParsingService.generateDisambiguationSuggestions(
    TEST_CASES.nextWeek,
    REFERENCE_DATE
  );

  if (results.length === 0) {
    console.log('❌ No suggestions found for "next week"');
    return;
  }

  const suggestions = results[0].suggestions;
  console.log(`✅ Found ${suggestions.length} suggestions for "next week":`);

  suggestions.forEach((suggestion, index) => {
    const date = suggestion.value as Date;
    const daysDiff = calculateDaysDifference(date, REFERENCE_DATE);
    console.log(
      `  ${index + 1}. ${suggestion.display} (${daysDiff} days ahead, confidence: ${suggestion.confidence})`
    );
  });
}

/**
 * Test end of month disambiguation
 */
function testEndOfMonthDisambiguation(): void {
  console.log('\n=== Test 2: End of Month Disambiguation ===');

  const results = dateParsingService.generateDisambiguationSuggestions(
    TEST_CASES.endOfMonth,
    REFERENCE_DATE
  );

  if (results.length === 0) {
    console.log('❌ No suggestions found for "end of month"');
    return;
  }

  const suggestions = results[0].suggestions;
  console.log(`✅ Found ${suggestions.length} suggestions for "end of month":`);

  suggestions.forEach((suggestion, index) => {
    console.log(
      `  ${index + 1}. ${suggestion.display} (confidence: ${suggestion.confidence})`
    );
  });
}

/**
 * Test integration with parseInput
 */
function testParseInputIntegration(): void {
  console.log('\n=== Test 3: Integration with parseInput ===');

  const parseResult = dateParsingService.parseInput(
    TEST_CASES.integration,
    REFERENCE_DATE
  );

  console.log(`📝 Parsed title: "${parseResult.title}"`);
  console.log(`🎯 Confidence: ${parseResult.confidence.toFixed(2)}`);
  console.log(
    `❓ Ambiguous elements: ${parseResult.ambiguousElements?.length || 0}`
  );

  if (
    parseResult.ambiguousElements &&
    parseResult.ambiguousElements.length > 0
  ) {
    parseResult.ambiguousElements.forEach((element, index) => {
      console.log(
        `  Element ${index + 1}: "${element.originalText}" (${element.suggestions.length} suggestions)`
      );
    });
  }
}

/**
 * Simulate API endpoint behavior
 */
function simulateDisambiguationAPI(dateText: string, referenceDate: Date) {
  try {
    const ambiguousElements =
      dateParsingService.generateDisambiguationSuggestions(
        dateText,
        referenceDate
      );

    return {
      success: true,
      ambiguousElements,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to disambiguate date',
    };
  }
}

/**
 * Test API endpoint simulation
 */
function testAPIEndpointSimulation(): void {
  console.log('\n=== Test 4: API Endpoint Simulation ===');

  const apiResult = simulateDisambiguationAPI(
    TEST_CASES.nextWeek,
    REFERENCE_DATE
  );

  if (apiResult.success) {
    console.log('✅ API Response successful');
    console.log(
      `📊 Found ${apiResult.ambiguousElements?.length || 0} ambiguous elements`
    );
  } else {
    console.log('❌ API Response failed:', apiResult.error);
  }

  // Pretty print a sample of the response
  if (
    apiResult.success &&
    apiResult.ambiguousElements &&
    apiResult.ambiguousElements.length > 0
  ) {
    const firstElement = apiResult.ambiguousElements[0];
    console.log(
      `📋 Sample element: "${firstElement.originalText}" with ${firstElement.suggestions.length} suggestions`
    );
  }
}

/**
 * Main test runner
 */
function runTests(): void {
  console.log('🧪 Testing Date Disambiguation System');
  console.log(`📅 Reference Date: ${formatDate(REFERENCE_DATE)}\n`);

  try {
    testNextWeekDisambiguation();
    testEndOfMonthDisambiguation();
    testParseInputIntegration();
    testAPIEndpointSimulation();

    console.log('\n✅ Date disambiguation system testing complete!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runTests();
}

export { runTests, simulateDisambiguationAPI };
