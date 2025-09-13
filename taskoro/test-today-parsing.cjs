// Test "today" parsing with different timezones
const {
  dateParsingService,
} = require('./server/dist/services/dateParsingService.js');

function testTodayParsing() {
  console.log('🗓️  Testing "Today" Parsing Across Timezones...\n');

  const testTimezones = [
    'America/New_York', // Eastern Time
    'America/Los_Angeles', // Pacific Time
    'Europe/London', // GMT/BST
    'Asia/Tokyo', // JST
    'Australia/Sydney', // AEST/AEDT
    undefined, // Server timezone (no timezone specified)
  ];

  testTimezones.forEach((timezone) => {
    console.log(`\n🌍 Testing timezone: ${timezone || 'Server Default'}`);

    try {
      // Test "today" parsing
      const todayResult = dateParsingService.parseInput(
        'Meeting today',
        new Date(),
        timezone
      );

      // Get what "today" should be in that timezone
      let expectedDate;
      if (timezone) {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        expectedDate = formatter.format(now);
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        expectedDate = `${year}-${month}-${day}`;
      }

      // Format the parsed result
      let parsedDate = 'None';
      if (todayResult.dueDate) {
        const date = new Date(todayResult.dueDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        parsedDate = `${year}-${month}-${day}`;
      }

      console.log(`  Input: "Meeting today"`);
      console.log(`  Expected date: ${expectedDate}`);
      console.log(`  Parsed date: ${parsedDate}`);
      console.log(`  Match: ${expectedDate === parsedDate ? '✅' : '❌'}`);
      console.log(`  Title: "${todayResult.title}"`);
      console.log(`  Confidence: ${Math.round(todayResult.confidence * 100)}%`);

      if (expectedDate !== parsedDate) {
        console.log(`  ⚠️  MISMATCH DETECTED!`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    console.log('  ' + '─'.repeat(50));
  });

  // Test "tomorrow" as well
  console.log('\n🌅 Testing "Tomorrow" Parsing...\n');

  testTimezones.slice(0, 3).forEach((timezone) => {
    console.log(`\n🌍 Testing timezone: ${timezone || 'Server Default'}`);

    try {
      const tomorrowResult = dateParsingService.parseInput(
        'Call tomorrow',
        new Date(),
        timezone
      );

      // Get what "tomorrow" should be in that timezone
      let expectedDate;
      if (timezone) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        expectedDate = formatter.format(tomorrow);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        expectedDate = `${year}-${month}-${day}`;
      }

      // Format the parsed result
      let parsedDate = 'None';
      if (tomorrowResult.dueDate) {
        const date = new Date(tomorrowResult.dueDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        parsedDate = `${year}-${month}-${day}`;
      }

      console.log(`  Input: "Call tomorrow"`);
      console.log(`  Expected date: ${expectedDate}`);
      console.log(`  Parsed date: ${parsedDate}`);
      console.log(`  Match: ${expectedDate === parsedDate ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  });
}

// Run the test
testTodayParsing();
