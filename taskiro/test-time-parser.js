// Simple test runner for time parser
import { TimeParser } from './src/utils/timeParser.js';

console.log('🧪 Testing Time Parser...\n');

// Test cases
const testCases = [
  // 24-hour format
  { input: '14:30', expected: '14:30', description: '24-hour format' },
  {
    input: '09:05',
    expected: '09:05',
    description: '24-hour with leading zero',
  },
  { input: '00:00', expected: '00:00', description: 'midnight 24-hour' },

  // 12-hour format
  { input: '9:30 AM', expected: '09:30', description: '12-hour AM' },
  { input: '2:45 PM', expected: '14:45', description: '12-hour PM' },
  { input: '12:00 AM', expected: '00:00', description: '12 AM (midnight)' },
  { input: '12:00 PM', expected: '12:00', description: '12 PM (noon)' },

  // Compact formats
  { input: '1430', expected: '14:30', description: 'compact 4-digit' },
  { input: '930', expected: '09:30', description: 'compact 3-digit' },

  // Natural language
  { input: 'noon', expected: '12:00', description: 'natural language noon' },
  {
    input: 'midnight',
    expected: '00:00',
    description: 'natural language midnight',
  },

  // Hour only
  { input: '9 AM', expected: '09:00', description: 'hour only AM' },
  { input: '3 PM', expected: '15:00', description: 'hour only PM' },

  // Invalid cases
  { input: '25:00', expected: null, description: 'invalid hour' },
  { input: '12:60', expected: null, description: 'invalid minute' },
  { input: '', expected: null, description: 'empty input' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  try {
    const result = TimeParser.parseTime(input);

    if (expected === null) {
      // Expecting failure
      if (!result.success) {
        console.log(`✅ ${description}: "${input}" correctly failed`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`   Suggestions: ${result.suggestions.join(', ')}`);
        }
        passed++;
      } else {
        console.log(
          `❌ ${description}: "${input}" should have failed but got "${result.time}"`
        );
        failed++;
      }
    } else {
      // Expecting success
      if (result.success && result.time === expected) {
        console.log(
          `✅ ${description}: "${input}" → "${result.time}" (display: "${result.displayTime}")`
        );
        passed++;
      } else {
        console.log(
          `❌ ${description}: "${input}" expected "${expected}" but got "${result.time || 'FAILED'}"`
        );
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        failed++;
      }
    }
  } catch (error) {
    console.log(`❌ ${description}: "${input}" threw error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

// Test auto-complete suggestions
console.log('\n🔍 Testing Auto-complete Suggestions:');
const autoCompleteTests = ['', '9', '9:', 'no', 'mid'];
autoCompleteTests.forEach((input) => {
  const suggestions = TimeParser.getAutoCompleteSuggestions(input);
  console.log(`"${input}" → [${suggestions.join(', ')}]`);
});

console.log('\n✨ Time Parser testing complete!');
