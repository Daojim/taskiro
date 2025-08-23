import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function testTimezoneFix() {
  console.log('🕐 Testing Timezone Fix...\n');

  // Simulate a task with August 23 at 5 PM
  const taskDueDate = new Date('2024-08-23'); // Date only
  const taskDueTime = new Date('1970-01-01T17:00:00'); // Time only (5 PM)

  console.log('Original task data:');
  console.log('Due Date:', taskDueDate.toDateString());
  console.log('Due Time:', taskDueTime.toTimeString());

  // Old method (problematic)
  const eventStartOld = new Date(taskDueDate);
  eventStartOld.setHours(taskDueTime.getHours(), taskDueTime.getMinutes());

  console.log('\n❌ Old method (UTC conversion):');
  console.log('Event Start (local):', eventStartOld.toString());
  console.log('Event Start (ISO/UTC):', eventStartOld.toISOString());
  console.log(
    'This would show as:',
    new Date(eventStartOld.toISOString()).toLocaleString('en-US', {
      timeZone: 'America/Toronto',
    })
  );

  // New method (fixed)
  const eventStartNew = new Date(taskDueDate);
  eventStartNew.setHours(taskDueTime.getHours(), taskDueTime.getMinutes());

  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  console.log('\n✅ New method (local timezone):');
  console.log('Event Start (local):', eventStartNew.toString());
  console.log('Event Start (formatted):', formatLocalDateTime(eventStartNew));
  console.log('Timezone:', 'America/Toronto');
  console.log('This should show as: August 23, 2024 at 5:00 PM Eastern');

  // Test another example: August 25 at 10 AM
  console.log('\n' + '='.repeat(50));
  console.log('Testing August 25 at 10 AM:');

  const taskDueDate2 = new Date('2024-08-25');
  const taskDueTime2 = new Date('1970-01-01T10:00:00');

  const eventStart2 = new Date(taskDueDate2);
  eventStart2.setHours(taskDueTime2.getHours(), taskDueTime2.getMinutes());

  console.log('Formatted datetime:', formatLocalDateTime(eventStart2));
  console.log('Timezone: America/Toronto');
  console.log('Should show as: August 25, 2024 at 10:00 AM Eastern');
}

testTimezoneFix();
