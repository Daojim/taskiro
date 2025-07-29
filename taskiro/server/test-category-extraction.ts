import { dateParsingService } from './services/dateParsingService';

console.log('Testing Category Extraction Functionality\n');

// Test cases for different categories
const testCases = [
  // Work category tests
  {
    input: 'Meeting with client tomorrow',
    expectedCategory: 'work',
    description: 'Work meeting',
  },
  {
    input: 'Finish the project report by Friday',
    expectedCategory: 'work',
    description: 'Work project',
  },
  {
    input: 'Prepare presentation for team',
    expectedCategory: 'work',
    description: 'Work presentation',
  },

  // Personal category tests
  {
    input: 'Buy groceries for dinner',
    expectedCategory: 'personal',
    description: 'Personal shopping',
  },
  {
    input: 'Doctor appointment at 3pm',
    expectedCategory: 'personal',
    description: 'Personal health',
  },
  {
    input: 'Go to the gym after work',
    expectedCategory: 'personal',
    description: 'Personal fitness',
  },

  // School category tests
  {
    input: 'Submit assignment by Friday',
    expectedCategory: 'school',
    description: 'School assignment',
  },
  {
    input: 'Study for exam next week',
    expectedCategory: 'school',
    description: 'School studying',
  },
  {
    input: 'Attend lecture at university',
    expectedCategory: 'school',
    description: 'School lecture',
  },

  // Combined tests
  {
    input: 'Urgent meeting with client about project deadline',
    expectedCategory: 'work',
    expectedPriority: 'high',
    description: 'Work with priority',
  },

  // No category tests
  {
    input: 'Do something tomorrow',
    expectedCategory: undefined,
    description: 'Generic task',
  },
];

console.log('=== Category Suggestion Tests ===\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: "${testCase.input}"`);

  const result = dateParsingService.getCategorySuggestion(testCase.input);

  console.log(`Expected Category: ${testCase.expectedCategory || 'none'}`);
  console.log(`Actual Category: ${result.category || 'none'}`);
  console.log(`Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`Matched Keywords: [${result.matchedKeywords.join(', ')}]`);

  const success = result.category === testCase.expectedCategory;
  console.log(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});

console.log('\n=== Full Parse Input Tests ===\n');

const fullParseTests = [
  'Meeting with client tomorrow at 2pm',
  'Buy groceries after work on Friday',
  'Submit assignment by next Tuesday',
  'Urgent presentation for team meeting',
  'Doctor appointment next week',
];

fullParseTests.forEach((input, index) => {
  console.log(`Full Parse Test ${index + 1}: "${input}"`);

  const result = dateParsingService.parseInput(input);

  console.log(`Title: "${result.title}"`);
  console.log(`Category: ${result.category || 'none'}`);
  console.log(`Priority: ${result.priority || 'none'}`);
  console.log(
    `Due Date: ${result.dueDate ? result.dueDate.toDateString() : 'none'}`
  );
  console.log(`Due Time: ${result.dueTime || 'none'}`);
  console.log(`Confidence: ${result.confidence.toFixed(2)}`);
  console.log('---');
});

console.log('\n=== Category Keywords Reference ===\n');

const keywords = dateParsingService.getCategoryKeywords();
Object.entries(keywords).forEach(([category, words]) => {
  console.log(
    `${category.toUpperCase()}: ${words.slice(0, 10).join(', ')}${words.length > 10 ? '...' : ''} (${words.length} total)`
  );
});

console.log('\nCategory extraction testing completed!');
