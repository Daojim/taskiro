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
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

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

  // Auto-refresh status every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadStatus]);

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
      setSyncHistory((prev) => [result, ...prev.slice(0, 4)]); // Keep last 5 sync results
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
        <div
          className={`mb-4 p-3 border rounded-md ${
            syncResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className={`text-sm font-medium ${
                syncResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              Sync Results {syncResult.success ? '✅' : '❌'}
            </h4>
            {syncResult.result.syncedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(syncResult.result.syncedAt).toLocaleString()}
              </span>
            )}
          </div>

          <div
            className={`text-xs space-y-1 ${
              syncResult.success
                ? 'text-green-600 dark:text-green-300'
                : 'text-red-600 dark:text-red-300'
            }`}
          >
            {syncResult.result.totalProcessed !== undefined && (
              <div>Total processed: {syncResult.result.totalProcessed}</div>
            )}
            {syncResult.result.tasksCreated !== undefined &&
              syncResult.result.tasksCreated > 0 && (
                <div>✨ Tasks created: {syncResult.result.tasksCreated}</div>
              )}
            {syncResult.result.tasksUpdated !== undefined &&
              syncResult.result.tasksUpdated > 0 && (
                <div>📝 Tasks updated: {syncResult.result.tasksUpdated}</div>
              )}
            {syncResult.result.eventsCreated !== undefined &&
              syncResult.result.eventsCreated > 0 && (
                <div>📅 Events created: {syncResult.result.eventsCreated}</div>
              )}
            {syncResult.result.eventsUpdated !== undefined &&
              syncResult.result.eventsUpdated > 0 && (
                <div>🔄 Events updated: {syncResult.result.eventsUpdated}</div>
              )}
            {syncResult.result.skipped !== undefined &&
              syncResult.result.skipped > 0 && (
                <div className="text-yellow-600 dark:text-yellow-400">
                  ⏭️ Skipped: {syncResult.result.skipped}
                </div>
              )}

            {syncResult.result.warnings &&
              syncResult.result.warnings.length > 0 && (
                <div className="mt-2">
                  <div className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Warnings:
                  </div>
                  {syncResult.result.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="text-yellow-600 dark:text-yellow-400 ml-2"
                    >
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              )}

            {syncResult.result.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-red-600 dark:text-red-400 font-medium">
                  Errors:
                </div>
                {syncResult.result.errors.map((error, index) => (
                  <div
                    key={index}
                    className="text-red-600 dark:text-red-400 ml-2"
                  >
                    ❌ {error}
                  </div>
                ))}
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
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
            {status.integration?.lastSyncAt && (
              <div className="flex items-center space-x-2">
                <span>Last sync:</span>
                <span className="font-medium">
                  {new Date(status.integration.lastSyncAt).toLocaleString()}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.integration.lastSyncStatus === 'SUCCESS'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {status.integration.lastSyncStatus === 'SUCCESS'
                    ? '✅ Success'
                    : '❌ Error'}
                </span>
              </div>
            )}
            {!status.integration?.lastSyncAt && (
              <p className="text-yellow-600 dark:text-yellow-400">
                ⚠️ No sync performed yet
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Sync Controls */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Sync Options
              </h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSync('bidirectional')}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700 flex items-center space-x-2"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                >
                  <span>{syncing ? '🔄' : '🔄'}</span>
                  <span>{syncing ? 'Syncing...' : 'Full Sync'}</span>
                </button>
                <button
                  onClick={() => handleSync('tasks-to-calendar')}
                  disabled={syncing}
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-600 hover:border-green-700 flex items-center space-x-2"
                  style={{ backgroundColor: '#059669', color: 'white' }}
                >
                  <span>📝</span>
                  <span>Tasks → Calendar</span>
                </button>
                <button
                  onClick={() => handleSync('events-to-tasks')}
                  disabled={syncing}
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-600 hover:border-purple-700 flex items-center space-x-2"
                  style={{ backgroundColor: '#7c3aed', color: 'white' }}
                >
                  <span>📅</span>
                  <span>Calendar → Tasks</span>
                </button>
              </div>
            </div>

            {/* Advanced Controls */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Advanced Options
              </h4>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={handleRefreshToken}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🔑 Refresh Token
                </button>

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Auto-refresh status
                  </span>
                </label>

                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-3 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Sync History */}
          {syncHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Recent Sync History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {syncHistory.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md text-xs border ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          result.success
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {result.success ? '✅' : '❌'} Sync{' '}
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      {result.result.syncedAt && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(
                            result.result.syncedAt
                          ).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div
                      className={`mt-1 ${
                        result.success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {result.result.totalProcessed && (
                        <span>
                          Processed: {result.result.totalProcessed} |{' '}
                        </span>
                      )}
                      {result.result.tasksCreated &&
                        result.result.tasksCreated > 0 && (
                          <span>Tasks: +{result.result.tasksCreated} | </span>
                        )}
                      {result.result.eventsCreated &&
                        result.result.eventsCreated > 0 && (
                          <span>Events: +{result.result.eventsCreated} | </span>
                        )}
                      {result.result.errors.length > 0 && (
                        <span>Errors: {result.result.errors.length}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
