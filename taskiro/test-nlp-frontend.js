// Simple test script to verify NLP API works
import axios from 'axios';

async function testNLPAPI() {
  try {
    console.log('Testing NLP Parse API...');

    const response = await axios.post(
      'http://localhost:3001/api/nlp/parse',
      {
        input: 'Buy groceries tomorrow at 3pm',
        referenceDate: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ NLP Parse API Response:');
    console.log(JSON.stringify(response.data, null, 2));

    // Test disambiguation
    console.log('\nTesting Disambiguation API...');
    const disambigResponse = await axios.post(
      'http://localhost:3001/api/nlp/disambiguate',
      {
        dateText: 'next week',
        referenceDate: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Disambiguation API Response:');
    console.log(JSON.stringify(disambigResponse.data, null, 2));
  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testNLPAPI();
