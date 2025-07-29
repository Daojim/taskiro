import { dateParsingService } from './services/dateParsingService';

console.log('Testing NLP API functionality (simulated)...\n');

// Simulate API requests
const testRequests = [
  {
    endpoint: '/api/nlp/parse',
    body: { input: 'Meeting with client tomorrow at 2pm' },
  },
  {
    endpoint: '/api/nlp/suggest-category',
    body: { text: 'Buy groceries for dinner' },
  },
  {
    endpoint: '/api/nlp/suggest-category',
    body: { text: 'Submit assignment by Friday' },
  },
];

testRequests.forEach((request, index) => {
  console.log(`Test ${index + 1}: ${request.endpoint}`);
  console.log(`Request body:`, JSON.stringify(request.body, null, 2));

  if (request.endpoint === '/api/nlp/parse') {
    const result = dateParsingService.parseInput(request.body.input || '');
    console.log(
      'Response:',
      JSON.stringify(
        {
          success: true,
          parsed: result,
        },
        null,
        2
      )
    );
  } else if (request.endpoint === '/api/nlp/suggest-category') {
    const suggestion = dateParsingService.getCategorySuggestion(
      request.body.text || ''
    );
    console.log(
      'Response:',
      JSON.stringify(
        {
          success: true,
          suggestion,
        },
        null,
        2
      )
    );
  }

  console.log('---\n');
});

console.log('NLP API testing completed!');
