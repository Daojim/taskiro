import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { googleCalendarService } from './services/googleCalendar';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function listUserCalendars() {
  console.log('📅 Listing Google Calendars...\n');

  try {
    // You'll need to replace this with your actual user ID
    // You can get it from the database or from a login
    const users = await prisma.user.findMany({
      include: {
        calendarIntegrations: true,
      },
    });

    const userWithCalendar = users.find(
      (user) => user.calendarIntegrations.length > 0
    );

    if (!userWithCalendar) {
      console.log('❌ No user found with calendar integration');
      return;
    }

    console.log(`👤 User: ${userWithCalendar.email}`);
    console.log(
      `🔗 Integration ID: ${userWithCalendar.calendarIntegrations[0].id}\n`
    );

    // Get calendar client
    const calendar = await googleCalendarService.getCalendarClient(
      userWithCalendar.id
    );

    // List all calendars
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    console.log(`📊 Total calendars found: ${calendars.length}\n`);

    calendars.forEach((cal, index) => {
      console.log(`${index + 1}. ${cal.summary}`);
      console.log(`   ID: ${cal.id}`);
      console.log(`   Access Role: ${cal.accessRole}`);
      console.log(`   Primary: ${cal.primary ? 'Yes' : 'No'}`);
      console.log(`   Selected: ${cal.selected ? 'Yes' : 'No'}`);
      if (cal.description) {
        console.log(`   Description: ${cal.description}`);
      }
      console.log('');
    });

    // Show which calendar we're using for sync
    const primaryCalendar = calendars.find((cal) => cal.primary);
    if (primaryCalendar) {
      console.log(
        `🎯 Primary calendar (used for sync): ${primaryCalendar.summary}`
      );
    }
  } catch (error) {
    console.error('❌ Error listing calendars:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUserCalendars().catch(console.error);
