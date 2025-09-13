// Test server-side date handling
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testServerDateHandling() {
  console.log('🔧 Testing Server-Side Date Handling...\n');

  // Test data
  const testTask = {
    title: 'Test timezone task',
    dueDate: '2024-01-15', // YYYY-MM-DD format
    priority: 'medium',
  };

  try {
    console.log('📤 Sending task creation request...');
    console.log('Task data:', JSON.stringify(testTask, null, 2));

    // Note: This test requires authentication, so it will fail without a valid token
    // But we can see the request format and server response structure
    const response = await axios.post(`${API_BASE_URL}/tasks`, testTask, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE' // Would need real token
      },
    });

    console.log('✅ Task created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Check if the date is preserved correctly
    const returnedDate = response.data.task.dueDate;
    console.log(`\n📅 Date preservation check:`);
    console.log(`Sent: ${testTask.dueDate}`);
    console.log(`Received: ${returnedDate}`);
    console.log(`Match: ${testTask.dueDate === returnedDate ? '✅' : '❌'}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required (expected for this test)');
      console.log('Server is running and accepting requests');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
      console.log('Start the server with: npm run server:dev');
    } else {
      console.log('❌ Request failed:', error.response?.data || error.message);
    }
  }
}

// Test the date parsing function directly
function testDateParsingFunction() {
  console.log('\n🧪 Testing Date Parsing Function...\n');

  const parseDateSafely = (dateString) => {
    // For YYYY-MM-DD format, create date at midnight UTC to avoid timezone shifts
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateString + 'T00:00:00.000Z');
    }
    // For other formats, use regular Date constructor
    return new Date(dateString);
  };

  const testDates = ['2024-01-15', '2024-12-25', '2024-06-30T10:30:00Z'];

  testDates.forEach((dateStr) => {
    const parsed = parseDateSafely(dateStr);
    const formatted = parsed.toISOString().split('T')[0];

    console.log(`Input: ${dateStr}`);
    console.log(`Parsed: ${parsed.toISOString()}`);
    console.log(`Formatted: ${formatted}`);

    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const isCorrect = formatted === dateStr;
      console.log(`Preservation: ${isCorrect ? '✅' : '❌'}`);
    }
    console.log('---');
  });
}

// Run tests
console.log('🚀 Starting Server Timezone Tests...\n');
testDateParsingFunction();
testServerDateHandling();
