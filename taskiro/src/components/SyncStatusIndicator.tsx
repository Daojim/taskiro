import { useState } from 'react';
import {
  WifiIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { ConflictResolutionModal } from './ConflictResolutionModal';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({
  className = '',
  showDetails = false,
}: SyncStatusIndicatorProps) {
  const {
    status,
    sync,
    forceSync,
    getStorageInfo,
    getSyncInfo,
    enableAutoSync,
    disableAutoSync,
  } = useOfflineSync();
  const [showInfo, setShowInfo] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState<unknown>(null);
  const [syncInfo, setSyncInfo] = useState<unknown>(null);

  const handleInfoClick = async () => {
    if (!showInfo) {
      try {
        const [storageData, syncData] = await Promise.all([
          getStorageInfo(),
          getSyncInfo(),
        ]);
        setStorageInfo(storageData);
        setSyncInfo(syncData);
      } catch (error) {
        console.error('Failed to get sync info:', error);
      }
    }
    setShowInfo(!showInfo);
  };

  const handleSyncClick = async () => {
    try {
      if (status.isOnline) {
        await sync();
      } else {
        await forceSync();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusIcon = () => {
    if (status.isSyncing) {
      return <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (status.conflicts > 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
    }

    if (status.error) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }

    if (!status.isOnline) {
      return <WifiIcon className="h-4 w-4 text-gray-400" />;
    }

    if (status.pendingActions > 0) {
      return <CloudIcon className="h-4 w-4 text-yellow-500" />;
    }

    return <CloudIcon className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (status.isSyncing) return 'Syncing...';
    if (status.conflicts > 0)
      return `${status.conflicts} conflict${status.conflicts !== 1 ? 's' : ''}`;
    if (status.error) return 'Sync error';
    if (!status.isOnline) return 'Offline';
    if (status.pendingActions > 0) return `${status.pendingActions} pending`;
    return 'Synced';
  };

  const getStatusColor = () => {
    if (status.isSyncing) return 'text-primary-600';
    if (status.conflicts > 0) return 'text-orange-600';
    if (status.error) return 'text-red-600';
    if (!status.isOnline) return 'text-gray-600';
    if (status.pendingActions > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleToggleAutoSync = async () => {
    try {
      if (status.autoSyncEnabled) {
        await disableAutoSync();
      } else {
        await enableAutoSync();
      }
    } catch (error) {
      console.error('Failed to toggle auto-sync:', error);
    }
  };

  const handleResolveConflicts = () => {
    setShowConflictModal(true);
  };

  const handleConflictsResolved = () => {
    setShowConflictModal(false);
    // Refresh sync info
    handleInfoClick();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Status Icon */}
        <div className="flex items-center">{getStatusIcon()}</div>

        {/* Status Text */}
        {showDetails && (
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        )}

        {/* Last Sync Time */}
        {showDetails && status.lastSync && (
          <div className="text-xs text-gray-500">
            {formatLastSync(status.lastSync)}
          </div>
        )}

        {/* Conflict Resolution Button */}
        {status.conflicts > 0 && (
          <button
            onClick={handleResolveConflicts}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-orange-600"
            title="Resolve sync conflicts"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </button>
        )}

        {/* Manual Sync Button */}
        <button
          onClick={handleSyncClick}
          disabled={status.isSyncing}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title={status.isOnline ? 'Sync now' : 'Check connection and sync'}
        >
          <ArrowPathIcon
            className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${
              status.isSyncing ? 'animate-spin' : ''
            }`}
          />
        </button>

        {/* Auto-sync Toggle */}
        {showDetails && (
          <button
            onClick={handleToggleAutoSync}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title={
              status.autoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'
            }
          >
            {status.autoSyncEnabled ? (
              <PauseIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <PlayIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        {/* Info Button */}
        {showDetails && (
          <button
            onClick={handleInfoClick}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Show sync details"
          >
            <InformationCircleIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {status.error && showDetails && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-md shadow-lg backdrop-blur-sm z-10 min-w-64">
          <div className="text-sm text-red-800 dark:text-red-200 font-medium">
            {status.error}
          </div>
        </div>
      )}

      {/* Storage Info Modal */}
      {showInfo && storageInfo && syncInfo && (
        <div
          className="absolute top-full right-0 mt-1 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl z-20 min-w-80"
          style={{ backgroundColor: 'var(--bg-primary, #ffffff)' }}
        >
          <div className="text-sm space-y-3">
            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Sync Status
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Storage
                  </div>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300">
                    <div>Tasks: {storageInfo.tasksCount}</div>
                    <div>Categories: {storageInfo.categoriesCount}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Sync Queue
                  </div>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300">
                    <div>Pending: {storageInfo.syncQueueCount}</div>
                    <div>Conflicts: {syncInfo.conflictSummary.total}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    Auto-sync:
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      status.autoSyncEnabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {status.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-700 dark:text-gray-300">
                    Last sync:
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatLastSync(storageInfo.lastSync)}
                  </span>
                </div>
              </div>

              {syncInfo.conflictSummary.total > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleResolveConflicts}
                    className="w-full px-3 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                  >
                    Resolve {syncInfo.conflictSummary.total} Conflict
                    {syncInfo.conflictSummary.total !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onResolved={handleConflictsResolved}
      />
    </div>
  );
}
