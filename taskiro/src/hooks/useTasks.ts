import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useOfflineSync } from './useOfflineSync';
import type {
  Task,
  Category,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task';

interface UseTasksReturn {
  tasks: Task[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  createTask: (task: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: string, task: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskCompletion: (id: string) => Promise<Task | null>;
  restoreTask: (id: string) => Promise<Task | null>;
  refreshTasks: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  clearError: () => void;
  // Offline sync status
  syncStatus: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: number | null;
    pendingActions: number;
    error: string | null;
  };
  forceSync: () => Promise<void>;
}

/**
 * Custom hook for managing tasks and categories
 * Provides CRUD operations, optimistic updates, and centralized error handling
 *
 * @returns {UseTasksReturn} Object containing tasks, categories, loading state, and CRUD functions
 */
export const useTasks = (): UseTasksReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use offline sync hook for data management
  const {
    tasks,
    categories,
    status: syncStatus,
    loadTasks,
    loadCategories,
    createTask: createTaskOffline,
    updateTask: updateTaskOffline,
    deleteTask: deleteTaskOffline,
    toggleTaskCompletion: toggleTaskCompletionOffline,
    forceSync,
  } = useOfflineSync();

  // Prevent duplicate calls
  const pendingCallsRef = useRef<Set<string>>(new Set());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Centralized error handler with better type safety
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    let errorMessage = defaultMessage;

    if (err && typeof err === 'object') {
      const apiError = err as {
        error?: { message?: string };
        message?: string;
        response?: { data?: any };
      };

      // Log the full error details for debugging
      console.error('Full error object:', err);
      if (apiError.response?.data) {
        console.error('Server response data:', apiError.response.data);
      }
      // Try to extract more error details
      try {
        const errorStr = JSON.stringify(err, null, 2);
        console.error('Error as JSON:', errorStr);
      } catch (e) {
        console.error('Could not stringify error');
      }

      errorMessage =
        apiError.error?.message || apiError.message || defaultMessage;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    setError(errorMessage);
    console.error(defaultMessage, err);
    return errorMessage;
  }, []);

  // Use ref to prevent duplicate calls
  const isRefreshingRef = useRef(false);

  const refreshTasks = useCallback(
    async (retryCount = 0) => {
      // Prevent duplicate calls
      if (isRefreshingRef.current) {
        console.log('⚠️ Skipping duplicate refreshTasks call');
        return;
      }

      isRefreshingRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        // Use offline sync to load tasks (handles online/offline automatically)
        await loadTasks();
      } catch (err: unknown) {
        // Retry logic for network errors
        if (retryCount < 2 && err && typeof err === 'object') {
          const apiError = err as { message?: string };
          if (
            apiError.message?.toLowerCase().includes('network') ||
            apiError.message?.toLowerCase().includes('fetch')
          ) {
            console.log(`Retrying task fetch (attempt ${retryCount + 1})`);
            setTimeout(
              () => refreshTasks(retryCount + 1),
              1000 * (retryCount + 1)
            );
            return;
          }
        }

        handleError(err, 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
        isRefreshingRef.current = false;
      }
    },
    [handleError, loadTasks]
  );

  const refreshCategories = useCallback(async () => {
    try {
      setError(null);
      // Use offline sync to load categories (handles online/offline automatically)
      await loadCategories();
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch categories');
    }
  }, [handleError, loadCategories]);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);

        // Debug: Check if taskData has unexpected properties
        if ('id' in taskData || 'userId' in taskData) {
          console.error(
            'ERROR: createTask called with full task object instead of CreateTaskRequest:',
            taskData
          );
          return null;
        }

        console.log('About to call createTaskOffline with:', taskData);
        // Use offline sync to create task (handles online/offline automatically)
        const newTask = await createTaskOffline(taskData);

        return newTask;
      } catch (err: unknown) {
        console.log('createTask caught error:', err);
        handleError(err, 'Failed to create task');
        return null;
      }
    },
    [handleError, createTaskOffline]
  );

  const updateTask = useCallback(
    async (id: string, taskData: UpdateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        // Use offline sync to update task (handles online/offline automatically)
        const updatedTask = await updateTaskOffline(id, taskData);
        console.log('useTasks updateTask success:', { id, updatedTask });

        return updatedTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to update task');
        return null;
      }
    },
    [handleError, updateTaskOffline]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        // Use offline sync to delete task (handles online/offline automatically)
        await deleteTaskOffline(id);

        return true;
      } catch (err: unknown) {
        handleError(err, 'Failed to delete task');
        return false;
      }
    },
    [handleError, deleteTaskOffline]
  );

  const toggleTaskCompletion = useCallback(
    async (id: string): Promise<Task | null> => {
      // Prevent duplicate calls for the same task
      if (pendingCallsRef.current.has(id)) {
        console.log(`Skipping duplicate toggle call for task ${id}`);
        return null;
      }

      pendingCallsRef.current.add(id);

      try {
        setError(null);

        // Use offline sync to toggle task completion
        const updatedTask = await toggleTaskCompletionOffline(id);

        return updatedTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to toggle task completion');
        return null;
      } finally {
        // Remove from pending calls
        pendingCallsRef.current.delete(id);
      }
    },
    [handleError, toggleTaskCompletionOffline]
  );

  const restoreTask = useCallback(
    async (id: string): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.restoreTask(id);
        const restoredTask = response.task;

        // Refresh tasks to get updated data
        await loadTasks();

        return restoredTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to restore task');
        return null;
      }
    },
    [handleError, loadTasks]
  );

  // Use ref to ensure initial load only happens once
  const hasInitializedRef = useRef(false);

  // Load initial data - only run once on mount
  useEffect(() => {
    if (hasInitializedRef.current) {
      console.log('⚠️ Skipping duplicate initial load');
      return;
    }

    hasInitializedRef.current = true;
    refreshTasks();
    refreshCategories();
  }, []); // Empty dependency array - only run on mount

  return {
    tasks,
    categories,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    restoreTask,
    refreshTasks,
    refreshCategories,
    clearError,
    syncStatus,
    forceSync,
  };
};
