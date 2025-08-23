import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { googleCalendarService } from '../services/googleCalendar';
import { calendarSyncService } from '../services/calendarSync';

const router = express.Router();

/**
 * Get Google Calendar authorization URL
 */
router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({
      error: {
        code: 'AUTH_URL_ERROR',
        message: 'Failed to generate authorization URL',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Connect Google Calendar with authorization code
 */
router.post(
  '/connect',
  authenticateToken,
  [body('code').notEmpty().withMessage('Authorization code is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { code } = req.body;
      const userId = req.user!.id;

      console.log('📥 Calendar connect request received');
      console.log('User ID:', userId);
      console.log('Code received:', code ? 'YES' : 'NO');
      console.log('Code length:', code?.length || 0);

      // Exchange code for tokens
      const tokens = await googleCalendarService.exchangeCodeForTokens(code);

      // Store integration
      const integration = await googleCalendarService.storeCalendarIntegration(
        userId,
        tokens
      );

      // Test connection
      const connectionTest = await googleCalendarService.testConnection(userId);

      res.json({
        success: true,
        integration: {
          id: integration.id,
          connected: connectionTest.connected,
          calendars: connectionTest.calendars,
        },
      });
    } catch (error) {
      console.error('Error connecting calendar:', error);
      res.status(500).json({
        error: {
          code: 'CONNECTION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to connect calendar',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get calendar connection status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integration =
      await googleCalendarService.getCalendarIntegration(userId);

    if (!integration) {
      return res.json({
        connected: false,
        integration: null,
      });
    }

    const connectionTest = await googleCalendarService.testConnection(userId);

    res.json({
      connected: connectionTest.connected,
      integration: {
        id: integration.id,
        createdAt: integration.createdAt,
        calendars: connectionTest.calendars,
      },
      error: connectionTest.error,
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to get calendar status',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Disconnect Google Calendar
 */
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    await googleCalendarService.disconnectCalendar(userId);

    res.json({
      success: true,
      message: 'Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({
      error: {
        code: 'DISCONNECT_ERROR',
        message: 'Failed to disconnect calendar',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Sync tasks to Google Calendar
 */
router.post('/sync/tasks-to-calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await calendarSyncService.syncTasksToCalendar(userId);

    res.json({
      success: result.success,
      result: {
        eventsCreated: result.eventsCreated,
        eventsUpdated: result.eventsUpdated,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Error syncing tasks to calendar:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to sync tasks to calendar',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Sync events from Google Calendar to tasks
 */
router.post('/sync/events-to-tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await calendarSyncService.syncEventsToTasks(userId);

    res.json({
      success: result.success,
      result: {
        tasksCreated: result.tasksCreated,
        tasksUpdated: result.tasksUpdated,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Error syncing events to tasks:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to sync events to tasks',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Bidirectional sync
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await calendarSyncService.bidirectionalSync(userId);

    res.json({
      success: result.success,
      result: {
        tasksCreated: result.tasksCreated,
        tasksUpdated: result.tasksUpdated,
        eventsCreated: result.eventsCreated,
        eventsUpdated: result.eventsUpdated,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Error performing bidirectional sync:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to perform bidirectional sync',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const credentials = await googleCalendarService.refreshAccessToken(userId);

    res.json({
      success: true,
      tokenRefreshed: true,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: {
        code: 'TOKEN_REFRESH_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to refresh token',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
