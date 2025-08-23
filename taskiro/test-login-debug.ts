import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001';

async function testLoginFlow() {
  console.log('🔍 Testing Login Flow...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      console.log('   ✅ Server is running');
      console.log(`   📊 Status: ${healthResponse.data.status}`);
    } catch (error) {
      console.log('   ❌ Server is not running or not responding');
      console.log('   💡 Please start the server with: npm run server:dev');
      return;
    }

    // Test 2: Check database connection
    console.log('\n2. Checking database connection...');
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      console.log('   ✅ Database connected');
      console.log(`   📊 Total users: ${userCount}`);
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log(`   📝 Error: ${error}`);
      return;
    }

    // Test 3: Check environment variables
    console.log('\n3. Checking environment variables...');
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
    ];
    let envVarsOk = true;

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`);
      } else {
        console.log(`   ❌ ${envVar} is missing`);
        envVarsOk = false;
      }
    }

    if (!envVarsOk) {
      console.log('   💡 Please check your .env file');
      return;
    }

    // Test 4: Create a test user and try login
    console.log('\n4. Testing user registration and login...');
    const testEmail = `test-login-${Date.now()}@example.com`;
    const testPassword = 'password123';

    try {
      // Register test user
      console.log('   📝 Registering test user...');
      const registerResponse = await axios.post(
        `${API_BASE}/api/auth/register`,
        {
          email: testEmail,
          password: testPassword,
        }
      );

      if (registerResponse.data.user && registerResponse.data.tokens) {
        console.log('   ✅ Registration successful');
        console.log(`   👤 User: ${registerResponse.data.user.email}`);
        console.log(
          `   🔑 Access token: ${registerResponse.data.tokens.accessToken ? 'Present' : 'Missing'}`
        );
      } else {
        console.log('   ❌ Registration response missing expected data');
        console.log(
          `   📝 Response: ${JSON.stringify(registerResponse.data, null, 2)}`
        );
      }

      // Test login with the same credentials
      console.log('   🔐 Testing login...');
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testEmail,
        password: testPassword,
      });

      if (loginResponse.data.user && loginResponse.data.tokens) {
        console.log('   ✅ Login successful');
        console.log(`   👤 User: ${loginResponse.data.user.email}`);
        console.log(
          `   🔑 Access token: ${loginResponse.data.tokens.accessToken ? 'Present' : 'Missing'}`
        );

        // Test authenticated endpoint
        console.log('   🔒 Testing authenticated endpoint...');
        const meResponse = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.tokens.accessToken}`,
          },
        });

        if (meResponse.data.user) {
          console.log('   ✅ Authenticated endpoint working');
          console.log(`   👤 Profile: ${meResponse.data.user.email}`);
        } else {
          console.log('   ❌ Authenticated endpoint failed');
        }
      } else {
        console.log('   ❌ Login response missing expected data');
        console.log(
          `   📝 Response: ${JSON.stringify(loginResponse.data, null, 2)}`
        );
      }

      // Cleanup test user
      console.log('   🧹 Cleaning up test user...');
      await prisma.user.delete({
        where: { email: testEmail },
      });
      console.log('   ✅ Test user cleaned up');
    } catch (authError: unknown) {
      console.log('   ❌ Authentication test failed');
      console.log(
        `   📝 Error: ${authError.response?.data?.error?.message || authError.message}`
      );

      if (authError.response?.data) {
        console.log(
          `   📊 Full response: ${JSON.stringify(authError.response.data, null, 2)}`
        );
      }

      // Try to cleanup anyway
      try {
        await prisma.user.deleteMany({
          where: { email: testEmail },
        });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    console.log('\n✅ Login flow test completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLoginFlow().catch(console.error);
