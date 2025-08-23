import { PrismaClient } from '@prisma/client';
import { googleCalendarService } from './googleCalendar';
import { calendar_v3 } from 'googleapis';

const prisma = new PrismaClient();

export interface SyncResult {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  eventsCreated: number;
  eventsUpdated: number;
  errors: string[];
  warnings: string[];
  syncedAt: Date;
  totalProcessed: number;
  skipped: number;
}

export class CalendarSyncService {
  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    userId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      await prisma.calendarIntegration.updateMany({
        where: { userId },
        data: {
          lastSyncAt: result.syncedAt,
          lastSyncStatus: result.success ? 'SUCCESS' : 'ERROR',
        },
      });
    } catch (error) {
      console.error('Failed to update sync status:', error);
      // Don't throw here to avoid breaking the sync operation
    }
  }
  /**
   * Sync tasks to Google Calendar
   */
  async syncTasksToCalendar(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      tasksCreated: 0,
      tasksUpdated: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      errors: [],
      warnings: [],
      syncedAt: new Date(),
      totalProcessed: 0,
      skipped: 0,
    };

    try {
      const calendar = await googleCalendarService.getCalendarClient(userId);
      const integration =
        await googleCalendarService.getCalendarIntegration(userId);

      if (!integration) {
        result.errors.push('No calendar integration found');
        return result;
      }

      // Get active tasks with due dates
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          dueDate: {
            not: null,
          },
        },
        include: {
          category: true,
        },
      });

      for (const task of tasks) {
        result.totalProcessed++;

        try {
          // Check if task already has a corresponding event
          const existingEvents = await calendar.events.list({
            calendarId: integration.googleCalendarId || 'primary',
            q: task.title,
            timeMin: task.dueDate
              ? new Date(
                  task.dueDate.getTime() - 24 * 60 * 60 * 1000
                ).toISOString()
              : undefined,
            timeMax: task.dueDate
              ? new Date(
                  task.dueDate.getTime() + 24 * 60 * 60 * 1000
                ).toISOString()
              : undefined,
          });

          const existingEvent = existingEvents.data.items?.find(
            (event) => event.summary === task.title
          );

          const event = this.taskToCalendarEvent(task);

          if (existingEvent) {
            // Update existing event
            await calendar.events.update({
              calendarId: integration.googleCalendarId || 'primary',
              eventId: existingEvent.id!,
              requestBody: event,
            });
            result.eventsUpdated++;
          } else {
            // Create new event
            await calendar.events.insert({
              calendarId: integration.googleCalendarId || 'primary',
              requestBody: event,
            });
            result.eventsCreated++;
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('Rate limit')) {
            result.warnings.push(
              `Rate limited while syncing task "${task.title}". Will retry later.`
            );
            result.skipped++;
          } else {
            result.errors.push(
              `Failed to sync task "${task.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      result.success = result.errors.length === 0;

      // Update sync status in database
      await this.updateSyncStatus(userId, result);

      return result;
    } catch (error) {
      result.errors.push(
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Update sync status even on failure
      await this.updateSyncStatus(userId, result);

      return result;
    }
  }

  /**
   * Sync events from Google Calendar to tasks
   */
  async syncEventsToTasks(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      tasksCreated: 0,
      tasksUpdated: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      errors: [],
      warnings: [],
      syncedAt: new Date(),
      totalProcessed: 0,
      skipped: 0,
    };

    try {
      const calendar = await googleCalendarService.getCalendarClient(userId);
      const integration =
        await googleCalendarService.getCalendarIntegration(userId);

      if (!integration) {
        result.errors.push('No calendar integration found');
        return result;
      }

      // Get events from the next 30 days
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const response = await calendar.events.list({
        calendarId: integration.googleCalendarId || 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      for (const event of events) {
        result.totalProcessed++;

        try {
          // Skip events without summary or all-day events without dates
          if (
            !event.summary ||
            (!event.start?.dateTime && !event.start?.date)
          ) {
            result.skipped++;
            result.warnings.push(
              `Skipped event without title or date: ${event.id}`
            );
            continue;
          }

          // Parse event date/time properly
          let dueDate: Date | null = null;
          let dueTime: Date | null = null;

          if (event.start?.date) {
            // All-day event - parse as local date without timezone conversion
            const dateParts = event.start.date.split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(dateParts[2], 10);
            dueDate = new Date(year, month, day);
          } else if (event.start?.dateTime) {
            // Timed event
            const eventDateTime = new Date(event.start.dateTime);

            // Extract date part (without time) - use local date components
            dueDate = new Date(
              eventDateTime.getFullYear(),
              eventDateTime.getMonth(),
              eventDateTime.getDate()
            );

            // Extract time part as a Time field (using 1970-01-01 as base date)
            // Use UTC to avoid timezone conversion for the time component
            dueTime = new Date(
              Date.UTC(
                1970,
                0,
                1, // January 1, 1970
                eventDateTime.getHours(),
                eventDateTime.getMinutes(),
                eventDateTime.getSeconds()
              )
            );
          }

          if (!dueDate) continue;

          // Check if task already exists (basic check by title and date)
          const existingTask = await prisma.task.findFirst({
            where: {
              userId,
              title: event.summary,
              dueDate: {
                equals: dueDate,
              },
            },
          });

          if (!existingTask) {
            // Create new task from event
            await prisma.task.create({
              data: {
                userId,
                title: event.summary,
                description: event.description || null,
                dueDate: dueDate,
                dueTime: dueTime,
                priority: 'MEDIUM',
                status: 'ACTIVE',
              },
            });

            result.tasksCreated++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync event "${event.summary}": ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      result.success = result.errors.length === 0;

      // Update sync status in database
      await this.updateSyncStatus(userId, result);

      return result;
    } catch (error) {
      result.errors.push(
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Update sync status even on failure
      await this.updateSyncStatus(userId, result);

      return result;
    }
  }

  /**
   * Bidirectional sync
   */
  async bidirectionalSync(userId: string): Promise<SyncResult> {
    const tasksToCalendarResult = await this.syncTasksToCalendar(userId);
    const eventsToTasksResult = await this.syncEventsToTasks(userId);

    const combinedResult: SyncResult = {
      success: tasksToCalendarResult.success && eventsToTasksResult.success,
      tasksCreated: eventsToTasksResult.tasksCreated,
      tasksUpdated: eventsToTasksResult.tasksUpdated,
      eventsCreated: tasksToCalendarResult.eventsCreated,
      eventsUpdated: tasksToCalendarResult.eventsUpdated,
      errors: [...tasksToCalendarResult.errors, ...eventsToTasksResult.errors],
      warnings: [
        ...(tasksToCalendarResult.warnings || []),
        ...(eventsToTasksResult.warnings || []),
      ],
      syncedAt: new Date(),
      totalProcessed:
        (tasksToCalendarResult.totalProcessed || 0) +
        (eventsToTasksResult.totalProcessed || 0),
      skipped:
        (tasksToCalendarResult.skipped || 0) +
        (eventsToTasksResult.skipped || 0),
    };

    // Update sync status for bidirectional sync
    await this.updateSyncStatus(userId, combinedResult);

    return combinedResult;
  }

  /**
   * Convert task to Google Calendar event
   */
  private taskToCalendarEvent(task: {
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    dueTime?: Date | null;
    priority: string;
  }): calendar_v3.Schema$Event {
    const event: calendar_v3.Schema$Event = {
      summary: task.title,
      description: task.description || undefined,
    };

    // Set event time
    if (task.dueDate) {
      // Parse the date properly to avoid timezone issues
      // If dueDate comes from Prisma as a Date field, it should be treated as local date
      const dueDateObj = new Date(task.dueDate);

      // Extract UTC date components to avoid local timezone shifts
      const year = dueDateObj.getUTCFullYear();
      const month = dueDateObj.getUTCMonth();
      const day = dueDateObj.getUTCDate();

      if (task.dueTime) {
        // Specific time event - combine date and time properly
        // dueTime from Prisma is a Time field, so we need to extract hours/minutes
        const timeString = task.dueTime.toISOString(); // This gives us something like "1970-01-01T14:30:00.000Z"
        const timeParts = timeString.split('T')[1].split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        // Create the event start time by combining the due date with the time
        // Use UTC date components but local time to avoid timezone shifts
        const eventStart = new Date(year, month, day, hours, minutes, 0);
        const eventEnd = new Date(eventStart);
        eventEnd.setHours(eventStart.getHours() + 1); // 1 hour duration

        // Use America/Toronto (Eastern Time) as the timezone
        // In a production app, you'd store the user's timezone preference
        const userTimeZone = 'America/Toronto';

        // Format as local datetime without timezone conversion
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        event.start = {
          dateTime: formatLocalDateTime(eventStart),
          timeZone: userTimeZone,
        };
        event.end = {
          dateTime: formatLocalDateTime(eventEnd),
          timeZone: userTimeZone,
        };
      } else {
        // All-day event - use date only
        // Format date as YYYY-MM-DD using UTC components to avoid timezone shifts
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateString = `${year}-${monthStr}-${dayStr}`;

        event.start = {
          date: dateString,
        };
        event.end = {
          date: dateString,
        };
      }
    }

    // Set color based on priority
    if (task.priority === 'HIGH') {
      event.colorId = '11'; // Red
    } else if (task.priority === 'MEDIUM') {
      event.colorId = '5'; // Yellow
    } else {
      event.colorId = '2'; // Green
    }

    return event;
  }
}

export const calendarSyncService = new CalendarSyncService();
