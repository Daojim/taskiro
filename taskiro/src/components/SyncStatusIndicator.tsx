import { useState } from 'react';
import {
  WifiIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({
  className = '',
  showDetails = false,
}: SyncStatusIndicatorProps) {
  const { status, sync, forceSync, getStorageInfo } = useOfflineSync();
  const [showInfo, setShowInfo] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  const handleInfoClick = async () => {
    if (!showInfo) {
      try {
        const info = await getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to get storage info:', error);
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
    if (status.error) return 'Sync error';
    if (!status.isOnline) return 'Offline';
    if (status.pendingActions > 0) return `${status.pendingActions} pending`;
    return 'Synced';
  };

  const getStatusColor = () => {
    if (status.isSyncing) return 'text-blue-600';
    if (status.error) return 'text-red-600';
    if (!status.isOnline) return 'text-gray-600';
    if (status.pendingActions > 0) return 'text-yellow-600';
    return 'text-green-600';
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
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md shadow-sm z-10 min-w-64">
          <div className="text-sm text-red-700 dark:text-red-300">
            {status.error}
          </div>
        </div>
      )}

      {/* Storage Info Modal */}
      {showInfo && storageInfo && (
        <div className="absolute top-full right-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-64">
          <div className="text-sm space-y-2">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Offline Storage
            </div>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <div>Tasks: {storageInfo.tasksCount}</div>
              <div>Categories: {storageInfo.categoriesCount}</div>
              <div>Pending: {storageInfo.syncQueueCount}</div>
              <div>Last sync: {formatLastSync(storageInfo.lastSync)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
