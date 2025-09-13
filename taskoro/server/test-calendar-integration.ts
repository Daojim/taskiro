import dotenv from 'dotenv';
import { googleCalendarService } from './services/googleCalendar';

// Load environment variables
dotenv.config();

async function testCalendarIntegration() {
  console.log('🔧 Testing Google Calendar Integration Setup...\n');

  // Test 1: Check environment variables
  console.log('1. Checking environment variables:');
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
  ];
  let envVarsOk = true;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (
      !value ||
      value === 'your-google-client-id' ||
      value === 'your-google-client-secret'
    ) {
      console.log(`   ❌ ${envVar}: Not configured`);
      envVarsOk = false;
    } else {
      console.log(`   ✅ ${envVar}: Configured`);
    }
  }

  if (!envVarsOk) {
    console.log(
      '\n⚠️  Please configure Google Calendar credentials in .env file'
    );
    console.log(
      '   1. Go to Google Cloud Console: https://console.cloud.google.com/'
    );
    console.log('   2. Create a new project or select existing one');
    console.log('   3. Enable Google Calendar API');
    console.log('   4. Create OAuth 2.0 credentials');
    console.log(
      '   5. Add redirect URI: http://localhost:5173/calendar/callback'
    );
    console.log('   6. Copy Client ID and Client Secret to .env file\n');
  }

  // Test 2: Generate auth URL
  console.log('2. Testing auth URL generation:');
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    console.log('   ✅ Auth URL generated successfully');
    console.log(`   📋 Auth URL: ${authUrl.substring(0, 100)}...`);
  } catch (error) {
    console.log(
      '   ❌ Failed to generate auth URL:',
      error instanceof Error ? error.message : error
    );
  }

  // Test 3: Database schema check
  console.log('\n3. Checking database schema:');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Try to query calendar integrations table
    await prisma.calendarIntegration.findMany({ take: 1 });
    console.log('   ✅ CalendarIntegration table exists');

    await prisma.$disconnect();
  } catch (error) {
    console.log(
      '   ❌ Database schema issue:',
      error instanceof Error ? error.message : error
    );
    console.log('   💡 Run: npm run db:push to update database schema');
  }

  console.log('\n🎉 Google Calendar Integration test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Configure Google OAuth credentials in .env');
  console.log('   2. Run the server: npm run server:dev');
  console.log('   3. Test the endpoints with a REST client');
  console.log('   4. Implement frontend integration');
}

// Run the test
testCalendarIntegration().catch(console.error);
