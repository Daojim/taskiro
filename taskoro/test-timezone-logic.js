// Direct test of timezone parsing logic without starting server
import { dateParsingService } from './server/dist/services/dateParsingService.js';

function testTimezoneParsing() {
  console.log('🕐 Testing Timezone-Aware Date Parsing Logic...\n');

  const testCases = [
    {
      input: 'Meeting today at 5 pm',
      timezone: 'America/Toronto',
      description: 'Today with time in Eastern timezone',
    },
    {
      input: 'Call tomorrow',
      timezone: 'America/Toronto',
      description: 'Tomorrow in Eastern timezone',
    },
    {
      input: 'Assignment next Monday',
      timezone: 'America/Toronto',
      description: 'Next Monday in Eastern timezone',
    },
    {
      input: 'Meeting today at 5 pm',
      timezone: undefined,
      description: 'Today with time (no timezone - server default)',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Timezone: ${testCase.timezone || 'server default'}`);

    try {
      // Create reference date - current time
      const referenceDate = new Date();
      console.log(`Reference Date (server): ${referenceDate.toString()}`);

      if (testCase.timezone) {
        const userLocalTime = new Date().toLocaleString('en-US', {
          timeZone: testCase.timezone,
        });
        const userReferenceDate = new Date(userLocalTime);
        console.log(
          `Reference Date (user timezone): ${userReferenceDate.toString()}`
        );
      }

      const parsed = dateParsingService.parseInput(
        testCase.input,
        referenceDate,
        testCase.timezone
      );

      console.log('✅ Parsed successfully:');
      console.log('  Title:', parsed.title);
      console.log(
        '  Due Date:',
        parsed.dueDate ? parsed.dueDate.toLocaleDateString() : 'None'
      );
      console.log('  Due Time:', parsed.dueTime || 'None');
      console.log('  Priority:', parsed.priority || 'None');
      console.log('  Confidence:', parsed.confidence);

      if (parsed.dueDate) {
        console.log('  Date Details:');
        console.log('    ISO String:', parsed.dueDate.toISOString());
        console.log('    Local String:', parsed.dueDate.toString());
        if (testCase.timezone) {
          console.log(
            '    In User Timezone:',
            parsed.dueDate.toLocaleString('en-US', {
              timeZone: testCase.timezone,
            })
          );
        }
      }

      if (parsed.ambiguousElements && parsed.ambiguousElements.length > 0) {
        console.log('  Ambiguous Elements:');
        parsed.ambiguousElements.forEach((element, index) => {
          console.log(
            `    ${index + 1}. ${element.originalText} (${element.type})`
          );
        });
      }
    } catch (error) {
      console.log('❌ Parsing failed:', error.message);
      console.log('Error details:', error);
    }

    console.log('─'.repeat(60));
  }

  // Test disambiguation with timezone
  console.log('\n🔄 Testing Date Disambiguation with Timezone...\n');

  try {
    const referenceDate = new Date();
    const ambiguousElements =
      dateParsingService.generateDisambiguationSuggestions(
        'next week',
        referenceDate,
        'America/Toronto'
      );

    console.log('✅ Disambiguation successful:');
    ambiguousElements.forEach((element, index) => {
      console.log(`  Element ${index + 1}: ${element.originalText}`);
      element.suggestions.forEach((suggestion, suggIndex) => {
        const date = new Date(suggestion.value);
        console.log(`    ${suggIndex + 1}. ${suggestion.display}`);
        console.log(`        Date: ${date.toLocaleDateString()}`);
        console.log(
          `        In Toronto: ${date.toLocaleString('en-US', { timeZone: 'America/Toronto' })}`
        );
      });
    });
  } catch (error) {
    console.log('❌ Disambiguation failed:', error.message);
  }
}

// Run the test
testTimezoneParsing();
