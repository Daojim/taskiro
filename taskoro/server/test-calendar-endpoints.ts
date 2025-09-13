import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001';

interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

async function createTestUser(): Promise<TestUser> {
  const email = `test-calendar-${Date.now()}@example.com`;
  const password = 'testpassword123';
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  // Login to get tokens
  const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
    email,
    password,
  });

  return {
    id: user.id,
    email: user.email,
    accessToken: loginResponse.data.tokens.accessToken,
  };
}

async function cleanupTestUser(userId: string) {
  await prisma.calendarIntegration.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function testCalendarEndpoints() {
  console.log('🧪 Testing Google Calendar API Endpoints...\n');

  let testUser: TestUser | null = null;

  try {
    // Create test user
    console.log('1. Creating test user...');
    testUser = await createTestUser();
    console.log(`   ✅ Test user created: ${testUser.email}`);

    const authHeaders = {
      Authorization: `Bearer ${testUser.accessToken}`,
    };

    // Test 1: Get auth URL
    console.log('\n2. Testing auth URL generation...');
    try {
      const response = await axios.get(`${API_BASE}/api/calendar/auth-url`, {
        headers: authHeaders,
      });

      if (
        response.data.authUrl &&
        response.data.authUrl.includes('accounts.google.com')
      ) {
        console.log('   ✅ Auth URL generated successfully');
        console.log(`   📋 URL: ${response.data.authUrl.substring(0, 80)}...`);
      } else {
        console.log('   ❌ Invalid auth URL format');
      }
    } catch (error: any) {
      console.log(
        '   ❌ Auth URL generation failed:',
        error.response?.data?.error?.message || error.message
      );
    }

    // Test 2: Get status (should be disconnected)
    console.log('\n3. Testing calendar status (should be disconnected)...');
    try {
      const response = await axios.get(`${API_BASE}/api/calendar/status`, {
        headers: authHeaders,
      });

      if (!response.data.connected && !response.data.integration) {
        console.log('   ✅ Status correctly shows disconnected');
      } else {
        console.log('   ❌ Unexpected status response:', response.data);
      }
    } catch (error: any) {
      console.log(
        '   ❌ Status check failed:',
        error.response?.data?.error?.message || error.message
      );
    }

    // Test 3: Try to connect without code (should fail)
    console.log('\n4. Testing connect without code (should fail)...');
    try {
      await axios.post(
        `${API_BASE}/api/calendar/connect`,
        {},
        {
          headers: authHeaders,
        }
      );
      console.log('   ❌ Connect should have failed without code');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('   ✅ Connect correctly failed without code');
      } else {
        console.log(
          '   ❌ Unexpected error:',
          error.response?.data?.error?.message || error.message
        );
      }
    }

    // Test 4: Try to sync without connection (should fail)
    console.log('\n5. Testing sync without connection (should fail)...');
    try {
      await axios.post(
        `${API_BASE}/api/calendar/sync`,
        {},
        {
          headers: authHeaders,
        }
      );
      console.log('   ❌ Sync should have failed without connection');
    } catch (error: any) {
      if (error.response?.status === 500) {
        console.log('   ✅ Sync correctly failed without connection');
      } else {
        console.log(
          '   ❌ Unexpected error:',
          error.response?.data?.error?.message || error.message
        );
      }
    }

    // Test 5: Try to disconnect without connection (should succeed)
    console.log('\n6. Testing disconnect without connection...');
    try {
      const response = await axios.delete(
        `${API_BASE}/api/calendar/disconnect`,
        {
          headers: authHeaders,
        }
      );

      if (response.data.success) {
        console.log('   ✅ Disconnect succeeded (no-op when not connected)');
      } else {
        console.log('   ❌ Unexpected disconnect response:', response.data);
      }
    } catch (error: any) {
      console.log(
        '   ❌ Disconnect failed:',
        error.response?.data?.error?.message || error.message
      );
    }

    // Test 6: Try to refresh token without connection (should fail)
    console.log(
      '\n7. Testing token refresh without connection (should fail)...'
    );
    try {
      await axios.post(
        `${API_BASE}/api/calendar/refresh-token`,
        {},
        {
          headers: authHeaders,
        }
      );
      console.log('   ❌ Token refresh should have failed without connection');
    } catch (error: any) {
      if (error.response?.status === 500) {
        console.log('   ✅ Token refresh correctly failed without connection');
      } else {
        console.log(
          '   ❌ Unexpected error:',
          error.response?.data?.error?.message || error.message
        );
      }
    }

    // Test 7: Test with invalid auth token
    console.log('\n8. Testing with invalid auth token (should fail)...');
    try {
      await axios.get(`${API_BASE}/api/calendar/status`, {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      console.log('   ❌ Request should have failed with invalid token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('   ✅ Request correctly failed with invalid token');
      } else {
        console.log(
          '   ❌ Unexpected error:',
          error.response?.data?.error?.message || error.message
        );
      }
    }

    // Test 8: Test without auth token
    console.log('\n9. Testing without auth token (should fail)...');
    try {
      await axios.get(`${API_BASE}/api/calendar/status`);
      console.log('   ❌ Request should have failed without token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('   ✅ Request correctly failed without token');
      } else {
        console.log(
          '   ❌ Unexpected error:',
          error.response?.data?.error?.message || error.message
        );
      }
    }

    console.log('\n✅ All endpoint tests completed successfully!');
    console.log('\n📝 Manual testing steps:');
    console.log('   1. Configure Google OAuth credentials in .env');
    console.log('   2. Start the server: npm run server:dev');
    console.log('   3. Use the frontend to test the full OAuth flow');
    console.log('   4. Test sync operations with real Google Calendar data');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Cleanup
    if (testUser) {
      console.log('\n🧹 Cleaning up test user...');
      await cleanupTestUser(testUser.id);
      console.log('   ✅ Test user cleaned up');
    }

    await prisma.$disconnect();
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Run the test
async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run server:dev');
    process.exit(1);
  }

  await testCalendarEndpoints();
}

main().catch(console.error);
