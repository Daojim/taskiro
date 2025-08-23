import React, { useState, useEffect, useCallback } from 'react';
import {
  calendarService,
  type CalendarStatus,
  type SyncResult,
} from '../services/calendarService';

interface CalendarIntegrationProps {
  onStatusChange?: (connected: boolean) => void;
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  onStatusChange,
}) => {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const calendarStatus = await calendarService.getStatus();
      setStatus(calendarStatus);
      onStatusChange?.(calendarStatus.connected);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load calendar status'
      );
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const code = await calendarService.authorizeWithPopup();
      await calendarService.connectCalendar(code);
      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect calendar'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await calendarService.disconnect();
      await loadStatus();
      setSyncResult(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to disconnect calendar'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (
    syncType: 'bidirectional' | 'tasks-to-calendar' | 'events-to-tasks'
  ) => {
    try {
      setSyncing(true);
      setError(null);

      let result: SyncResult;
      switch (syncType) {
        case 'bidirectional':
          result = await calendarService.bidirectionalSync();
          break;
        case 'tasks-to-calendar':
          result = await calendarService.syncTasksToCalendar();
          break;
        case 'events-to-tasks':
          result = await calendarService.syncEventsToTasks();
          break;
      }

      setSyncResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      setError(null);

      await calendarService.refreshToken();
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Google Calendar Integration
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-gray-400'}`}
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {status?.connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {syncResult && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Sync Results:
          </h4>
          <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
            {syncResult.result.tasksCreated !== undefined && (
              <div>Tasks created: {syncResult.result.tasksCreated}</div>
            )}
            {syncResult.result.tasksUpdated !== undefined && (
              <div>Tasks updated: {syncResult.result.tasksUpdated}</div>
            )}
            {syncResult.result.eventsCreated !== undefined && (
              <div>Events created: {syncResult.result.eventsCreated}</div>
            )}
            {syncResult.result.eventsUpdated !== undefined && (
              <div>Events updated: {syncResult.result.eventsUpdated}</div>
            )}
            {syncResult.result.errors.length > 0 && (
              <div className="text-red-600 dark:text-red-400">
                Errors: {syncResult.result.errors.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {!status?.connected ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your Google Calendar to sync tasks and events automatically.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
            style={{ backgroundColor: '#2563eb', color: 'white' }}
          >
            {loading ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Connected to Google Calendar</p>
            {status.integration?.calendars && (
              <p>Access to {status.integration.calendars} calendar(s)</p>
            )}
            {status.integration?.createdAt && (
              <p>
                Connected on{' '}
                {new Date(status.integration.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleSync('bidirectional')}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              {syncing ? 'Syncing...' : 'Full Sync'}
            </button>
            <button
              onClick={() => handleSync('tasks-to-calendar')}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Tasks → Calendar
            </button>
            <button
              onClick={() => handleSync('events-to-tasks')}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Calendar → Tasks
            </button>
            <button
              onClick={handleRefreshToken}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Refresh Token
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-600 hover:border-red-700"
              style={{ backgroundColor: '#dc2626', color: 'white' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
