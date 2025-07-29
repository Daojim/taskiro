// Test the complete task creation flow
import axios from 'axios';

async function testFullTaskFlow() {
  try {
    console.log('🔄 Testing Complete Task Creation Flow...\n');

    // First, we need to register/login to get a token
    console.log('1. Setting up authentication...');

    // Register a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    let authToken;
    try {
      const registerResponse = await axios.post(
        'http://localhost:3001/api/auth/register',
        {
          email: testEmail,
          password: testPassword,
        }
      );
      authToken = registerResponse.data.tokens.accessToken;
      console.log('✅ Test user registered successfully');
    } catch (error) {
      if (error.response?.status === 400) {
        // User might already exist, try login
        const loginResponse = await axios.post(
          'http://localhost:3001/api/auth/login',
          {
            email: testEmail,
            password: testPassword,
          }
        );
        authToken = loginResponse.data.tokens.accessToken;
        console.log('✅ Test user logged in successfully');
      } else {
        throw error;
      }
    }

    // Set up axios with auth header
    const authenticatedAxios = axios.create({
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Test 2: Get categories
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await authenticatedAxios.get(
      'http://localhost:3001/api/categories'
    );
    console.log(
      '✅ Categories fetched:',
      categoriesResponse.data.categories.map((c) => c.name)
    );

    // Test 3: Parse natural language and create task
    console.log('\n3. Testing natural language task creation...');
    const nlpResponse = await axios.post(
      'http://localhost:3001/api/nlp/parse',
      {
        input: 'Buy groceries tomorrow at 3pm high priority',
        referenceDate: new Date().toISOString(),
      }
    );

    const parsed = nlpResponse.data.parsed;
    console.log('✅ Parsed input:', {
      title: parsed.title,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      priority: parsed.priority,
    });

    // Create task from parsed data
    const taskData = {
      title: parsed.title,
      dueDate: parsed.dueDate
        ? new Date(parsed.dueDate).toISOString().split('T')[0]
        : undefined,
      dueTime: parsed.dueTime,
      priority: parsed.priority || 'medium',
    };

    const createResponse = await authenticatedAxios.post(
      'http://localhost:3001/api/tasks',
      taskData
    );
    console.log('✅ Task created:', {
      id: createResponse.data.task.id,
      title: createResponse.data.task.title,
      priority: createResponse.data.task.priority,
      status: createResponse.data.task.status,
    });

    // Test 4: Fetch tasks
    console.log('\n4. Fetching created tasks...');
    const tasksResponse = await authenticatedAxios.get(
      'http://localhost:3001/api/tasks'
    );
    console.log(
      '✅ Tasks fetched:',
      tasksResponse.data.tasks.length,
      'tasks found'
    );

    console.log('\n🎉 Complete Task Flow Test Passed!');
    console.log('\n📋 Flow Verified:');
    console.log('   ✅ User authentication');
    console.log('   ✅ Category fetching');
    console.log('   ✅ Natural language parsing');
    console.log('   ✅ Task creation from parsed data');
    console.log('   ✅ Task retrieval');
    console.log('\n🚀 TaskInput component is ready for use!');
  } catch (error) {
    console.error('❌ Full Flow Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFullTaskFlow();
