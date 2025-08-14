import { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { syncManager } from '../services/syncManager';
import {
  conflictResolver,
  type ConflictData,
} from '../services/conflictResolver';
import type { Task, Category } from '../types/task';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  onResolved,
}: ConflictResolutionModalProps) {
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(
    null
  );
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionChoice, setResolutionChoice] = useState<
    'local' | 'server' | 'merge'
  >('merge');

  const loadConflicts = useCallback(() => {
    const currentConflicts = conflictResolver.getConflicts();
    setConflicts(currentConflicts);
    if (currentConflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(currentConflicts[0]);
    }
  }, [selectedConflict]);

  useEffect(() => {
    if (isOpen) {
      loadConflicts();
      const unsubscribe = conflictResolver.addListener(setConflicts);
      return unsubscribe;
    }
  }, [isOpen, loadConflicts]);

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge'
  ) => {
    setIsResolving(true);
    try {
      let mergedData;
      if (resolution === 'merge' && selectedConflict) {
        mergedData = conflictResolver.createSmartMerge(selectedConflict);
      }

      await syncManager.resolveConflict(conflictId, resolution, mergedData);

      // Move to next conflict or close if none left
      const remainingConflicts = conflictResolver.getConflicts();
      if (remainingConflicts.length === 0) {
        onResolved();
        onClose();
      } else {
        setSelectedConflict(remainingConflicts[0]);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveAll = async (strategy: 'local' | 'server' | 'auto') => {
    setIsResolving(true);
    try {
      await syncManager.resolveAllConflicts(strategy);
      onResolved();
      onClose();
    } catch (error) {
      console.error('Failed to resolve all conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return 'Not set';
    if (field === 'dueDate' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (field === 'priority') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (field === 'status') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return String(value);
  };

  const renderTaskConflict = (conflict: ConflictData) => {
    const local = conflict.localVersion as Task;
    const server = conflict.serverVersion as Task;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Your Version
            </h4>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {local.title}
                </div>
                {conflict.conflictFields.includes('description') && (
                  <div>
                    <strong>Description:</strong> {local.description || 'None'}
                  </div>
                )}
                {conflict.conflictFields.includes('dueDate') && (
                  <div>
                    <strong>Due Date:</strong>{' '}
                    {formatFieldValue('dueDate', local.dueDate)}
                  </div>
                )}
                {conflict.conflictFields.includes('priority') && (
                  <div>
                    <strong>Priority:</strong>{' '}
                    {formatFieldValue('priority', local.priority)}
                  </div>
                )}
                {conflict.conflictFields.includes('status') && (
                  <div>
                    <strong>Status:</strong>{' '}
                    {formatFieldValue('status', local.status)}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Modified: {new Date(local.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Server Version
            </h4>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {server.title}
                </div>
                {conflict.conflictFields.includes('description') && (
                  <div>
                    <strong>Description:</strong> {server.description || 'None'}
                  </div>
                )}
                {conflict.conflictFields.includes('dueDate') && (
                  <div>
                    <strong>Due Date:</strong>{' '}
                    {formatFieldValue('dueDate', server.dueDate)}
                  </div>
                )}
                {conflict.conflictFields.includes('priority') && (
                  <div>
                    <strong>Priority:</strong>{' '}
                    {formatFieldValue('priority', server.priority)}
                  </div>
                )}
                {conflict.conflictFields.includes('status') && (
                  <div>
                    <strong>Status:</strong>{' '}
                    {formatFieldValue('status', server.status)}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Modified: {new Date(server.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {resolutionChoice === 'merge' && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Smart Merge Preview
            </h4>
            <div className="text-sm space-y-1">
              {(() => {
                const merged = conflictResolver.createSmartMerge(
                  conflict
                ) as Partial<Task>;
                return (
                  <>
                    <div>
                      <strong>Title:</strong> {merged.title}
                    </div>
                    {merged.description !== undefined && (
                      <div>
                        <strong>Description:</strong>{' '}
                        {merged.description || 'None'}
                      </div>
                    )}
                    {merged.dueDate !== undefined && (
                      <div>
                        <strong>Due Date:</strong>{' '}
                        {formatFieldValue('dueDate', merged.dueDate)}
                      </div>
                    )}
                    {merged.priority !== undefined && (
                      <div>
                        <strong>Priority:</strong>{' '}
                        {formatFieldValue('priority', merged.priority)}
                      </div>
                    )}
                    {merged.status !== undefined && (
                      <div>
                        <strong>Status:</strong>{' '}
                        {formatFieldValue('status', merged.status)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategoryConflict = (conflict: ConflictData) => {
    const local = conflict.localVersion as Category;
    const server = conflict.serverVersion as Category;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Your Version
            </h4>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {local.name}
                </div>
                <div className="flex items-center gap-2">
                  <strong>Color:</strong>
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: local.color }}
                  />
                  {local.color}
                </div>
                <div className="text-xs text-gray-500">
                  Modified: {new Date(local.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Server Version
            </h4>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {server.name}
                </div>
                <div className="flex items-center gap-2">
                  <strong>Color:</strong>
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: server.color }}
                  />
                  {server.color}
                </div>
                <div className="text-xs text-gray-500">
                  Modified: {new Date(server.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Resolve Sync Conflicts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}{' '}
                found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {selectedConflict && (
            <div className="space-y-6">
              {/* Conflict Navigation */}
              {conflicts.length > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Conflict {conflicts.indexOf(selectedConflict) + 1} of{' '}
                    {conflicts.length}
                  </div>
                  <div className="flex gap-2">
                    {conflicts.map((conflict, index) => (
                      <button
                        key={conflict.id}
                        onClick={() => setSelectedConflict(conflict)}
                        className={`w-8 h-8 rounded-full text-xs font-medium ${
                          conflict.id === selectedConflict.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {selectedConflict.type === 'task' ? 'Task' : 'Category'}{' '}
                    Conflict
                  </h3>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                    {selectedConflict.conflictFields.join(', ')}
                  </span>
                </div>

                {selectedConflict.type === 'task'
                  ? renderTaskConflict(selectedConflict)
                  : renderCategoryConflict(selectedConflict)}
              </div>

              {/* Resolution Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Choose Resolution
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setResolutionChoice('local')}
                    className={`p-3 rounded-lg border text-left ${
                      resolutionChoice === 'local'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">Keep Your Version</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Use your local changes
                    </div>
                  </button>

                  <button
                    onClick={() => setResolutionChoice('server')}
                    className={`p-3 rounded-lg border text-left ${
                      resolutionChoice === 'server'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      Use Server Version
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Accept server changes
                    </div>
                  </button>

                  <button
                    onClick={() => setResolutionChoice('merge')}
                    className={`p-3 rounded-lg border text-left ${
                      resolutionChoice === 'merge'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">Smart Merge</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Combine both versions
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => handleResolveAll('auto')}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              {isResolving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                'Auto-Resolve All'
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            {selectedConflict && (
              <button
                onClick={() =>
                  handleResolveConflict(selectedConflict.id, resolutionChoice)
                }
                disabled={isResolving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isResolving ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                Resolve This Conflict
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
