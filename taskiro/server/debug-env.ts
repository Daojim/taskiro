import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Debug:');
console.log(
  'GOOGLE_CLIENT_ID:',
  process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
);
console.log(
  'GOOGLE_CLIENT_SECRET:',
  process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
);
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

if (process.env.GOOGLE_CLIENT_ID) {
  console.log(
    'Client ID starts with:',
    process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...'
  );
}

// Test the Google Calendar service
import { googleCalendarService } from './services/googleCalendar';

try {
  const authUrl = googleCalendarService.getAuthUrl();
  console.log('✅ Auth URL generated successfully');
  console.log('Auth URL:', authUrl.substring(0, 100) + '...');
} catch (error) {
  console.log('❌ Error generating auth URL:', error);
}
