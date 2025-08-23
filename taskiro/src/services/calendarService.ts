import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface CalendarIntegration {
  id: string;
  connected: boolean;
  calendars?: number;
  createdAt?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  result: {
    tasksCreated?: number;
    tasksUpdated?: number;
    eventsCreated?: number;
    eventsUpdated?: number;
    errors: string[];
  };
}

export interface CalendarStatus {
  connected: boolean;
  integration: CalendarIntegration | null;
  error?: string;
}

class CalendarService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // Longer timeout for sync operations
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private getStoredTokens() {
    const tokens = localStorage.getItem('taskiro_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  /**
   * Get Google Calendar authorization URL
   */
  async getAuthUrl(): Promise<string> {
    try {
      const response = await this.api.get('/api/calendar/auth-url');
      return response.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw new Error('Failed to get authorization URL');
    }
  }

  /**
   * Connect Google Calendar with authorization code
   */
  async connectCalendar(code: string): Promise<CalendarIntegration> {
    try {
      const response = await this.api.post('/api/calendar/connect', { code });
      return response.data.integration;
    } catch (error: any) {
      console.error('Error connecting calendar:', error);
      const message =
        error.response?.data?.error?.message || 'Failed to connect calendar';
      throw new Error(message);
    }
  }

  /**
   * Get calendar connection status
   */
  async getStatus(): Promise<CalendarStatus> {
    try {
      const response = await this.api.get('/api/calendar/status');
      return response.data;
    } catch (error) {
      console.error('Error getting calendar status:', error);
      throw new Error('Failed to get calendar status');
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<void> {
    try {
      await this.api.delete('/api/calendar/disconnect');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      throw new Error('Failed to disconnect calendar');
    }
  }

  /**
   * Sync tasks to Google Calendar
   */
  async syncTasksToCalendar(): Promise<SyncResult> {
    try {
      const response = await this.api.post(
        '/api/calendar/sync/tasks-to-calendar'
      );
      return response.data;
    } catch (error: any) {
      console.error('Error syncing tasks to calendar:', error);
      const message =
        error.response?.data?.error?.message ||
        'Failed to sync tasks to calendar';
      throw new Error(message);
    }
  }

  /**
   * Sync events from Google Calendar to tasks
   */
  async syncEventsToTasks(): Promise<SyncResult> {
    try {
      const response = await this.api.post(
        '/api/calendar/sync/events-to-tasks'
      );
      return response.data;
    } catch (error: any) {
      console.error('Error syncing events to tasks:', error);
      const message =
        error.response?.data?.error?.message ||
        'Failed to sync events to tasks';
      throw new Error(message);
    }
  }

  /**
   * Perform bidirectional sync
   */
  async bidirectionalSync(): Promise<SyncResult> {
    try {
      const response = await this.api.post('/api/calendar/sync');
      return response.data;
    } catch (error: any) {
      console.error('Error performing bidirectional sync:', error);
      const message =
        error.response?.data?.error?.message || 'Failed to perform sync';
      throw new Error(message);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    try {
      await this.api.post('/api/calendar/refresh-token');
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      const message =
        error.response?.data?.error?.message || 'Failed to refresh token';
      throw new Error(message);
    }
  }

  /**
   * Open Google Calendar authorization in popup window
   */
  async authorizeWithPopup(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getAuthUrl();

        // Open popup window
        const popup = window.open(
          authUrl,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(
            new Error(
              'Failed to open popup window. Please allow popups for this site.'
            )
          );
          return;
        }

        // Listen for popup messages
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            popup.close();
            resolve(event.data.code);
          } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(new Error(event.data.error || 'Authorization failed'));
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Authorization cancelled'));
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const calendarService = new CalendarService();
