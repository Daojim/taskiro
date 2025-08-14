import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../services/syncManager';
import type {
  Task,
  Category,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingActions: number;
  error: string | null;
  conflicts: number;
  autoSyncEnabled: boolean;
}

interface UseOfflineSyncReturn {
  // Status
  status: SyncStatus;

  // Data operations
  tasks: Task[];
  categories: Category[];
  loadTasks: () => Promise<void>;
  loadCategories: () => Promise<void>;

  // Task operations
  createTask: (taskData: CreateTaskRequest) => Promise<Task>;
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<Task>;

  // Sync operations
  sync: () => Promise<void>;
  forceSync: () => Promise<void>;

  // Conflict resolution
  getConflicts: () => any[];
  resolveConflict: (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => Promise<void>;
  resolveAllConflicts: (
    strategy?: 'local' | 'server' | 'auto'
  ) => Promise<void>;

  // Sync control
  enableAutoSync: () => Promise<void>;
  disableAutoSync: () => Promise<void>;

  // Utility
  clearOfflineData: () => Promise<void>;
  getStorageInfo: () => Promise<any>;
  getSyncInfo: () => Promise<any>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [status, setStatus] = useState<SyncStatus>(syncManager.status);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setLoading] = useState(false);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncManager.addListener(setStatus);
    return unsubscribe;
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTasks(), loadCategories()]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = useCallback(async () => {
    try {
      const loadedTasks = await syncManager.loadTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      throw error;
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = await syncManager.loadCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }, []);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest): Promise<Task> => {
      try {
        const newTask = await syncManager.createTaskOffline(taskData);

        // Update local state optimistically
        setTasks((prevTasks) => [...prevTasks, newTask]);

        return newTask;
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskRequest): Promise<Task> => {
      try {
        const updatedTask = await syncManager.updateTaskOffline(
          taskId,
          updates
        );

        // Update local state optimistically
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
        );

        return updatedTask;
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      }
    },
    []
  );

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await syncManager.deleteTaskOffline(taskId);

      // Update local state optimistically
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'archived' as const,
                archivedAt: new Date().toISOString(),
              }
            : task
        )
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, []);

  const toggleTaskCompletion = useCallback(
    async (taskId: string): Promise<Task> => {
      try {
        const updatedTask =
          await syncManager.toggleTaskCompletionOffline(taskId);

        // Update local state optimistically
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
        );

        return updatedTask;
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        throw error;
      }
    },
    []
  );

  const sync = useCallback(async (): Promise<void> => {
    try {
      await syncManager.sync();
      // Reload data after sync
      await Promise.all([loadTasks(), loadCategories()]);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, [loadTasks, loadCategories]);

  const forceSync = useCallback(async (): Promise<void> => {
    try {
      await syncManager.forceSync();
      // Reload data after sync
      await Promise.all([loadTasks(), loadCategories()]);
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }, [loadTasks, loadCategories]);

  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      await syncManager.clearOfflineData();
      setTasks([]);
      setCategories([]);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  const getStorageInfo = useCallback(async () => {
    try {
      return await syncManager.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw error;
    }
  }, []);

  const getSyncInfo = useCallback(async () => {
    try {
      return await syncManager.getSyncInfo();
    } catch (error) {
      console.error('Failed to get sync info:', error);
      throw error;
    }
  }, []);

  const getConflicts = useCallback(() => {
    return syncManager.getConflicts();
  }, []);

  const resolveConflict = useCallback(
    async (
      conflictId: string,
      resolution: 'local' | 'server' | 'merge',
      mergedData?: any
    ) => {
      try {
        await syncManager.resolveConflict(conflictId, resolution, mergedData);
        // Reload data after conflict resolution
        await Promise.all([loadTasks(), loadCategories()]);
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        throw error;
      }
    },
    [loadTasks, loadCategories]
  );

  const resolveAllConflicts = useCallback(
    async (strategy: 'local' | 'server' | 'auto' = 'auto') => {
      try {
        await syncManager.resolveAllConflicts(strategy);
        // Reload data after conflict resolution
        await Promise.all([loadTasks(), loadCategories()]);
      } catch (error) {
        console.error('Failed to resolve all conflicts:', error);
        throw error;
      }
    },
    [loadTasks, loadCategories]
  );

  const enableAutoSync = useCallback(async () => {
    try {
      syncManager.enableAutoSync();
    } catch (error) {
      console.error('Failed to enable auto-sync:', error);
      throw error;
    }
  }, []);

  const disableAutoSync = useCallback(async () => {
    try {
      syncManager.disableAutoSync();
    } catch (error) {
      console.error('Failed to disable auto-sync:', error);
      throw error;
    }
  }, []);

  return {
    status,
    tasks,
    categories,
    loadTasks,
    loadCategories,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    sync,
    forceSync,
    getConflicts,
    resolveConflict,
    resolveAllConflicts,
    enableAutoSync,
    disableAutoSync,
    clearOfflineData,
    getStorageInfo,
    getSyncInfo,
  };
}
