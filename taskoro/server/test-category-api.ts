import express from 'express';
import nlpRoutes from './routes/nlp';

const app = express();
app.use(express.json());
app.use('/api/nlp', nlpRoutes);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Testing category suggestion API endpoint...\n');

  // Test the API endpoint
  testCategorySuggestionAPI();
});

async function testCategorySuggestionAPI() {
  const testCases = [
    'Meeting with client tomorrow',
    'Buy groceries for dinner',
    'Submit assignment by Friday',
    'Urgent presentation for team',
    'Do something random',
  ];

  for (const text of testCases) {
    try {
      const response = await fetch(
        `http://localhost:${PORT}/api/nlp/suggest-category`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );

      const result = await response.json();

      console.log(`Input: "${text}"`);
      console.log(`Response:`, JSON.stringify(result, null, 2));
      console.log('---');
    } catch (error) {
      console.error(`Error testing "${text}":`, error);
    }
  }

  console.log('API testing completed!');
  process.exit(0);
}
