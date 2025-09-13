// Test complete Taskiro setup with fresh user
import axios from 'axios';

async function testCompleteSetup() {
  try {
    console.log('🚀 Testing Complete Taskiro Setup...\n');

    // Generate unique test user
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testPassword = 'TestPassword123';

    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(
      'http://localhost:3001/api/auth/register',
      {
        email: testEmail,
        password: testPassword,
      }
    );

    console.log('✅ User registered successfully');
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   User ID:', registerResponse.data.user.id);

    const authToken = registerResponse.data.tokens.accessToken;

    // Set up authenticated axios
    const authenticatedAxios = axios.create({
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n2. Testing category fetching...');
    const categoriesResponse = await authenticatedAxios.get(
      'http://localhost:3001/api/categories'
    );
    console.log(
      '✅ Default categories created:',
      categoriesResponse.data.categories.map((c) => `${c.name} (${c.color})`)
    );

    console.log('\n3. Testing natural language parsing...');
    const nlpResponse = await axios.post(
      'http://localhost:3001/api/nlp/parse',
      {
        input: 'Buy groceries tomorrow at 3pm high priority',
        referenceDate: new Date().toISOString(),
      }
    );

    const parsed = nlpResponse.data.parsed;
    console.log('✅ Natural language parsed:', {
      title: parsed.title,
      dueDate: parsed.dueDate
        ? new Date(parsed.dueDate).toLocaleDateString()
        : 'None',
      dueTime: parsed.dueTime || 'None',
      priority: parsed.priority || 'medium',
      category: parsed.category || 'None',
      confidence: `${Math.round(parsed.confidence * 100)}%`,
    });

    console.log('\n4. Testing task creation...');
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
    console.log('✅ Task created successfully:', {
      id: createResponse.data.task.id,
      title: createResponse.data.task.title,
      priority: createResponse.data.task.priority,
      status: createResponse.data.task.status,
      dueDate: createResponse.data.task.dueDate,
      dueTime: createResponse.data.task.dueTime,
    });

    console.log('\n5. Testing task retrieval...');
    const tasksResponse = await authenticatedAxios.get(
      'http://localhost:3001/api/tasks'
    );
    console.log(
      '✅ Tasks retrieved:',
      tasksResponse.data.tasks.length,
      'task(s) found'
    );

    console.log('\n6. Testing disambiguation...');
    const disambigResponse = await axios.post(
      'http://localhost:3001/api/nlp/disambiguate',
      {
        dateText: 'next week',
        referenceDate: new Date().toISOString(),
      }
    );
    console.log(
      '✅ Disambiguation working:',
      disambigResponse.data.ambiguousElements[0].suggestions.length,
      'suggestions generated'
    );

    console.log('\n🎉 COMPLETE SETUP TEST PASSED! 🎉');
    console.log('\n📋 Everything is working:');
    console.log('   ✅ Docker & PostgreSQL database');
    console.log('   ✅ Backend server (Node.js + Express)');
    console.log('   ✅ User authentication & JWT tokens');
    console.log('   ✅ Database schema & Prisma ORM');
    console.log('   ✅ Natural language processing');
    console.log('   ✅ Task creation & management');
    console.log('   ✅ Date disambiguation');
    console.log('   ✅ Category management');

    console.log('\n🚀 Ready to run:');
    console.log('   Frontend: npm run dev');
    console.log('   Backend: npm run server:dev (already running)');
    console.log('   Database: docker compose up -d (already running)');
  } catch (error) {
    console.error('❌ Setup Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCompleteSetup();
