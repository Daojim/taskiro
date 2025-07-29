// Test the specific input that caused the crash
import axios from 'axios';

async function testSpecificInput() {
  try {
    console.log('🧪 Testing specific input: "Assignment 2 next Tuesday"');

    const response = await axios.post('http://localhost:3001/api/nlp/parse', {
      input: 'Assignment 2 next Tuesday',
      referenceDate: new Date().toISOString(),
    });

    console.log('✅ Parse Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Parse Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSpecificInput();
