// Simple test of timezone parsing logic
import { dateParsingService } from './server/services/dateParsingService';

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
    } catch (error) {
      console.log('❌ Parsing failed:', error.message);
    }

    console.log('─'.repeat(60));
  }
}

// Run the test
testTimezoneParsing();
