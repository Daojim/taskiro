import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

async function debugOAuth() {
  console.log('🔍 Debugging OAuth Configuration...\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  console.log(
    '   GOOGLE_CLIENT_ID:',
    process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
  );
  console.log(
    '   GOOGLE_CLIENT_SECRET:',
    process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
  );
  console.log('   GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // Test OAuth client creation
  console.log('\n2. Testing OAuth Client Creation:');
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    console.log('   ✅ OAuth2 client created successfully');

    // Test auth URL generation
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    console.log('   ✅ Auth URL generated successfully');
    console.log('   📋 Auth URL:', authUrl.substring(0, 100) + '...');

    // Check redirect URI format
    console.log('\n3. Redirect URI Analysis:');
    console.log('   Configured URI:', process.env.GOOGLE_REDIRECT_URI);
    console.log('   Expected format: http://localhost:5173/calendar/callback');

    if (
      process.env.GOOGLE_REDIRECT_URI ===
      'http://localhost:5173/calendar/callback'
    ) {
      console.log('   ✅ Redirect URI format is correct');
    } else {
      console.log(
        '   ⚠️  Redirect URI might not match Google Cloud Console configuration'
      );
    }
  } catch (error) {
    console.log('   ❌ Error creating OAuth client:', error);
  }

  console.log('\n4. Common Issues to Check:');
  console.log(
    '   - Ensure redirect URI in Google Cloud Console matches exactly'
  );
  console.log('   - Check that OAuth consent screen is properly configured');
  console.log('   - Verify you are added as a test user');
  console.log(
    '   - Make sure the authorization code is being passed correctly'
  );
}

debugOAuth().catch(console.error);
