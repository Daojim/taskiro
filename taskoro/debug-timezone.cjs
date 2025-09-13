// Debug timezone handling
const {
  dateParsingService,
} = require('./server/dist/services/dateParsingService.js');

function debugTimezoneHandling() {
  console.log('🔍 Debugging Timezone Handling...\n');

  const testTimezone = 'Europe/London';
  const now = new Date();

  console.log('Server time:', now.toString());
  console.log('Server UTC:', now.toISOString());

  // Test our timezone-aware reference date creation
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: testTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  console.log('\nFormatter parts for', testTimezone, ':', parts);

  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0');
  const month =
    parseInt(parts.find((p) => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0');

  console.log('Extracted components:', {
    year,
    month,
    day,
    hour,
    minute,
    second,
  });

  const timezoneAwareDate = new Date(year, month, day, hour, minute, second);
  console.log('Created timezone-aware date:', timezoneAwareDate.toString());
  console.log(
    'Created timezone-aware date ISO:',
    timezoneAwareDate.toISOString()
  );

  // Compare with what we expect
  const expectedInTimezone = now.toLocaleString('en-US', {
    timeZone: testTimezone,
  });
  console.log('Expected time in', testTimezone, ':', expectedInTimezone);

  // Test the actual parsing
  console.log('\n--- Testing actual parsing ---');
  const result = dateParsingService.parseInput(
    'Meeting today',
    now,
    testTimezone
  );
  console.log('Parsed result:', result);

  if (result.dueDate) {
    const parsedDate = new Date(result.dueDate);
    console.log('Parsed date:', parsedDate.toString());
    console.log('Parsed date ISO:', parsedDate.toISOString());

    const expectedDateStr = formatter.format(now).split(',')[0]; // Get just the date part
    console.log('Expected date string:', expectedDateStr);

    const parsedDateStr = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    console.log('Parsed date string:', parsedDateStr);
  }
}

debugTimezoneHandling();
