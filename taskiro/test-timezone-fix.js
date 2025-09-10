// Test the timezone fix directly without needing a running server
async function testTimezoneFix() {
  const { dateParsingService } = await import(
    './dist/server/services/dateParsingService.js'
  );

  console.log('🕐 Testing Timezone-Aware Date Parsing Fix...\n');

  // Test cases to verify the fix
  const testCases = [
    {
      input: 'Meeting today',
      timezone: 'America/Toronto',
      description: 'Today in Eastern timezone',
    },
    {
      input: 'Call tomorrow',
      timezone: 'America/Toronto',
      description: 'Tomorrow in Eastern timezone',
    },
    {
      input: 'Meeting today',
      timezone: 'America/Los_Angeles',
      description: 'Today in Pacific timezone',
    },
    {
      input: 'Assignment next Monday',
      timezone: 'Europe/London',
      description: 'Next Monday in London timezone',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Timezone: ${testCase.timezone}`);

    try {
      const parsed = dateParsingService.parseInput(
        testCase.input,
        new Date(),
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
        console.log(
          '    In User Timezone:',
          parsed.dueDate.toLocaleString('en-US', {
            timeZone: testCase.timezone,
          })
        );

        // Check if "today" gives us today's date in the user's timezone
        if (testCase.input.includes('today')) {
          const now = new Date();
          const todayInUserTz = now.toLocaleDateString('en-US', {
            timeZone: testCase.timezone,
          });
          const parsedDateInUserTz = parsed.dueDate.toLocaleDateString(
            'en-US',
            {
              timeZone: testCase.timezone,
            }
          );

          console.log('    Expected (today in user TZ):', todayInUserTz);
          console.log('    Actual (parsed in user TZ):', parsedDateInUserTz);
          console.log(
            '    ✅ Match:',
            todayInUserTz === parsedDateInUserTz ? 'YES' : 'NO'
          );
        }
      }
    } catch (error) {
      console.log('❌ Parsing failed:', error.message);
    }

    console.log('─'.repeat(50));
  }
}

// Run the test
testTimezoneFix().catch(console.error);
