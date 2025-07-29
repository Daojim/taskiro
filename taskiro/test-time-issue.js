// Test the time parsing issue
import axios from 'axios';

async function testTimeIssue() {
  try {
    console.log('🧪 Testing: "Buy groceries next wednesday at 6 PM"');

    const response = await axios.post('http://localhost:3001/api/nlp/parse', {
      input: 'Buy groceries next wednesday at 6 PM',
      referenceDate: new Date().toISOString(),
    });

    console.log('✅ Parse Response:');
    console.log('Title:', response.data.parsed.title);
    console.log('Due Date:', response.data.parsed.dueDate);
    console.log('Due Time:', response.data.parsed.dueTime);
    console.log(
      'Full Response:',
      JSON.stringify(response.data.parsed, null, 2)
    );
  } catch (error) {
    console.error('❌ Parse Failed:', error.message);
  }
}

testTimeIssue();
