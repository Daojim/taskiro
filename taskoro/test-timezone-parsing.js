const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testTimezoneParsing() {
  console.log('🕐 Testing Timezone-Aware Date Parsing...\n');

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
      const requestBody = {
        input: testCase.input,
      };

      if (testCase.timezone) {
        requestBody.timezone = testCase.timezone;
      }

      const response = await axios.post(
        `${API_BASE_URL}/nlp/parse`,
        requestBody
      );

      if (response.data.success) {
        const parsed = response.data.parsed;
        console.log('✅ Parsed successfully:');
        console.log('  Title:', parsed.title);
        console.log(
          '  Due Date:',
          parsed.dueDate
            ? new Date(parsed.dueDate).toLocaleDateString()
            : 'None'
        );
        console.log('  Due Time:', parsed.dueTime || 'None');
        console.log('  Priority:', parsed.priority || 'None');

        if (parsed.dueDate) {
          const parsedDate = new Date(parsed.dueDate);
          console.log('  Date Details:');
          console.log('    ISO String:', parsedDate.toISOString());
          console.log('    Local String:', parsedDate.toString());
          if (testCase.timezone) {
            console.log(
              '    In User Timezone:',
              parsedDate.toLocaleString('en-US', {
                timeZone: testCase.timezone,
              })
            );
          }
        }
      } else {
        console.log('❌ Parsing failed:', response.data.error);
      }
    } catch (error) {
      console.log(
        '❌ Request failed:',
        error.response?.data?.error || error.message
      );
    }

    console.log('─'.repeat(50));
  }

  // Test disambiguation with timezone
  console.log('\n🔄 Testing Date Disambiguation with Timezone...\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/nlp/disambiguate`, {
      dateText: 'next week',
      timezone: 'America/Toronto',
    });

    if (response.data.success) {
      console.log('✅ Disambiguation successful:');
      response.data.ambiguousElements.forEach((element, index) => {
        console.log(`  Element ${index + 1}: ${element.originalText}`);
        element.suggestions.forEach((suggestion, suggIndex) => {
          const date = new Date(suggestion.value);
          console.log(
            `    ${suggIndex + 1}. ${suggestion.display} (${date.toLocaleDateString()})`
          );
        });
      });
    } else {
      console.log('❌ Disambiguation failed:', response.data.error);
    }
  } catch (error) {
    console.log(
      '❌ Disambiguation request failed:',
      error.response?.data?.error || error.message
    );
  }
}

// Run the test
testTimezoneParsing().catch(console.error);
