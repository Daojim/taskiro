import { apiService } from './api';
import { offlineStorage } from './offlineStorage';
import { networkStatus } from './networkStatus';
import { conflictResolver, type ConflictData } from './conflictResolver';
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

type SyncStatusListener = (status: SyncStatus) => void;

class SyncManagerService {
  private listeners: Set<SyncStatusListener> = new Set();
  private _status: SyncStatus = {
    isOnline: networkStatus.isOnline,
    isSyncing: false,
    lastSync: null,
    pendingActions: 0,
    error: null,
    conflicts: 0,
    autoSyncEnabled: true,
  };
  private syncInProgress = false;
  private autoSyncEnabled = true;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private autoSyncTimer: number | null = null;
  private connectionRestoreTimer: number | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      await offlineStorage.init();

      // Listen to network status changes
      networkStatus.addListener(this.handleNetworkChange);

      // Listen to conflict changes
      conflictResolver.addListener(this.handleConflictChange);

      // Load initial status
      await this.updateStatus();

      // Start auto-sync if online
      if (this._status.isOnline && this.autoSyncEnabled) {
        this.startAutoSync();
      }
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
      this.updateStatus({ error: 'Failed to initialize offline storage' });
    }
  }

  private handleNetworkChange = async (isOnline: boolean): Promise<void> => {
    await this.updateStatus({ isOnline });

    if (isOnline && this.autoSyncEnabled && !this.syncInProgress) {
      // Clear any existing connection restore timer
      if (this.connectionRestoreTimer) {
        clearTimeout(this.connectionRestoreTimer);
        this.connectionRestoreTimer = null;
      }

      // Delay sync slightly to allow connection to stabilize
      this.connectionRestoreTimer = window.setTimeout(() => {
        this.sync();
        this.startAutoSync(); // Restart auto-sync
      }, 2000);
    } else if (!isOnline) {
      // Stop auto-sync when offline
      this.stopAutoSync();
    }
  };

  private handleConflictChange = (conflicts: ConflictData[]): void => {
    this.updateStatus({ conflicts: conflicts.length });
  };

  private async updateStatus(updates?: Partial<SyncStatus>): Promise<void> {
    const [lastSync, syncQueue] = await Promise.all([
      offlineStorage.getLastSyncTime(),
      offlineStorage.getSyncQueue(),
    ]);

    const conflictSummary = conflictResolver.getConflictSummary();

    this._status = {
      ...this._status,
      lastSync,
      pendingActions: syncQueue.length,
      conflicts: conflictSummary.total,
      autoSyncEnabled: this.autoSyncEnabled,
      ...updates,
    };

    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this._status });
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  private startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing timer

    if (!this.autoSyncEnabled) return;

    this.autoSyncTimer = window.setInterval(() => {
      if (
        this._status.isOnline &&
        this.autoSyncEnabled &&
        !this.syncInProgress
      ) {
        this.sync();
      }
    }, this.AUTO_SYNC_INTERVAL);
  }

  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  // Public API
  get status(): SyncStatus {
    return { ...this._status };
  }

  addListener(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: SyncStatusListener): void {
    this.listeners.delete(listener);
  }

  // Offline-first operations
  async toggleTaskCompletionOffline(taskId: string): Promise<Task> {
    // Get current task from offline storage
    const tasks = await offlineStorage.getTasks();
    let task = tasks.find((t) => t.id === taskId);

    // If not found by exact ID, try to find by title (for temp tasks that might have been synced)
    if (!task && this._status.isOnline) {
      // Try to refresh from server first
      try {
        await this.refreshFromServer();
        const refreshedTasks = await offlineStorage.getTasks();
        task = refreshedTasks.find((t) => t.id === taskId);
      } catch (error) {
        console.warn('Failed to refresh tasks from server:', error);
      }
    }

    if (!task) {
      throw new Error(`Task not found in offline storage: ${taskId}`);
    }

    // Toggle status locally
    const newStatus =
      task.status.toLowerCase() === 'completed' ? 'active' : 'completed';
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      completedAt:
        newStatus === 'completed' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.storeTask(updatedTask);

    // Add to sync queue with specific action type
    await offlineStorage.addToSyncQueue({
      type: 'TOGGLE_TASK_COMPLETION',
      data: { id: taskId },
    });

    await this.updateStatus();

    // Try to sync immediately if online
    if (this._status.isOnline) {
      this.sync();
    }

    return updatedTask;
  }

  async createTaskOffline(taskData: CreateTaskRequest): Promise<Task> {
    // If online, try to create directly on server first
    if (this._status.isOnline) {
      try {
        const response = await apiService.createTask(taskData);
        if (response.task) {
          // Store the real task from server
          await offlineStorage.storeTask(response.task);
          await this.updateStatus();
          return response.task;
        }
      } catch (error) {
        console.warn(
          'Failed to create task online, falling back to offline:',
          error
        );
        // Fall through to offline creation
      }
    }

    // Generate temporary ID for offline task
    const tempTask: Task = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: apiService.getStoredUser()?.id || '',
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      priority: taskData.priority || 'medium',
      status: 'active',
      categoryId: taskData.categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store offline
    await offlineStorage.storeTask(tempTask);

    // Add to sync queue
    await offlineStorage.addToSyncQueue({
      type: 'CREATE_TASK',
      data: taskData,
    });

    await this.updateStatus();

    // Try to sync immediately if online
    if (this._status.isOnline) {
      this.sync();
    }

    return tempTask;
  }

  async updateTaskOffline(
    taskId: string,
    updates: UpdateTaskRequest
  ): Promise<Task> {
    // Get current task from offline storage
    const tasks = await offlineStorage.getTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new Error('Task not found in offline storage');
    }

    // Update task locally
    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.storeTask(updatedTask);

    // Add to sync queue
    await offlineStorage.addToSyncQueue({
      type: 'UPDATE_TASK',
      data: { id: taskId, updates },
    });

    await this.updateStatus();

    // Try to sync immediately if online
    if (this._status.isOnline) {
      this.sync();
    }

    return updatedTask;
  }

  async deleteTaskOffline(taskId: string): Promise<void> {
    // Mark task as archived locally
    const tasks = await offlineStorage.getTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const archivedTask: Task = {
        ...task,
        status: 'archived',
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await offlineStorage.storeTask(archivedTask);
    }

    // Add to sync queue
    await offlineStorage.addToSyncQueue({
      type: 'DELETE_TASK',
      data: { id: taskId },
    });

    await this.updateStatus();

    // Try to sync immediately if online
    if (this._status.isOnline) {
      this.sync();
    }
  }

  // Data loading with offline fallback
  async loadTasks(): Promise<Task[]> {
    if (this._status.isOnline) {
      try {
        // Fetch both active and completed tasks since backend defaults to active only
        const [activeResponse, completedResponse] = await Promise.all([
          apiService.getTasks({ status: 'active' }),
          apiService.getTasks({ status: 'completed' }),
        ]);

        // Combine both arrays and sort by creation date for consistent ordering
        const allTasks = [
          ...activeResponse.tasks,
          ...completedResponse.tasks,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Store in offline cache
        await offlineStorage.storeTasks(allTasks);
        await offlineStorage.setLastSyncTime(Date.now());
        await this.updateStatus();

        return allTasks;
      } catch (error) {
        console.warn(
          'Failed to load tasks from API, falling back to offline:',
          error
        );
      }
    }

    // Load from offline storage
    return await offlineStorage.getTasks();
  }

  async loadCategories(): Promise<Category[]> {
    if (this._status.isOnline) {
      try {
        const response = await apiService.getCategories();
        const categories = response.categories;

        // Store in offline cache
        await offlineStorage.storeCategories(categories);
        await this.updateStatus();

        return categories;
      } catch (error) {
        console.warn(
          'Failed to load categories from API, falling back to offline:',
          error
        );
      }
    }

    // Load from offline storage
    return await offlineStorage.getCategories();
  }

  // Manual sync
  async sync(): Promise<void> {
    if (this.syncInProgress || !this._status.isOnline) {
      return;
    }

    this.syncInProgress = true;
    await this.updateStatus({ isSyncing: true, error: null });

    try {
      const syncQueue = await offlineStorage.getSyncQueue();

      for (const action of syncQueue) {
        try {
          await this.processSyncAction(action);
          await offlineStorage.removeSyncAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);

          // Increment retry count
          action.retryCount++;

          if (action.retryCount >= this.MAX_RETRY_COUNT) {
            // Remove failed action after max retries
            await offlineStorage.removeSyncAction(action.id);
            console.error('Removing action after max retries:', action);
          } else {
            // Update retry count
            await offlineStorage.updateSyncAction(action);
          }
        }
      }

      // Refresh data from server
      await this.refreshFromServer();

      await offlineStorage.setLastSyncTime(Date.now());
      await this.updateStatus({ error: null });
    } catch (error) {
      console.error('Sync failed:', error);
      await this.updateStatus({
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      this.syncInProgress = false;
      await this.updateStatus({ isSyncing: false });
    }
  }

  private async processSyncAction(action: any): Promise<void> {
    switch (action.type) {
      case 'CREATE_TASK': {
        const response = await apiService.createTask(action.data);
        // Update offline storage with the real task from server
        if (response.task) {
          await offlineStorage.storeTask(response.task);
          // Remove any temporary task with temp_ ID
          const tasks = await offlineStorage.getTasks();
          const tempTask = tasks.find(
            (t) => t.id.startsWith('temp_') && t.title === response.task.title
          );
          if (tempTask && tempTask.id !== response.task.id) {
            await offlineStorage.deleteTask(tempTask.id);
          }
        }
        break;
      }

      case 'UPDATE_TASK':
        await apiService.updateTask(action.data.id, action.data.updates);
        break;

      case 'TOGGLE_TASK_COMPLETION':
        await apiService.toggleTaskCompletion(action.data.id);
        break;

      case 'DELETE_TASK':
        await apiService.deleteTask(action.data.id);
        break;

      case 'CREATE_CATEGORY': {
        const response = await apiService.createCategory(action.data);
        // Update offline storage with the real category from server
        if (response.category) {
          await offlineStorage.storeCategory(response.category);
        }
        break;
      }

      case 'UPDATE_CATEGORY':
        await apiService.updateCategory(action.data.id, action.data.updates);
        break;

      case 'DELETE_CATEGORY':
        await apiService.deleteCategory(action.data.id, action.data.options);
        break;

      default:
        console.warn('Unknown sync action type:', action.type);
    }
  }

  private async refreshFromServer(): Promise<void> {
    try {
      // Get current local data for conflict detection
      const [localTasks, localCategories] = await Promise.all([
        offlineStorage.getTasks(),
        offlineStorage.getCategories(),
      ]);

      // Refresh tasks and categories from server
      const [activeResponse, completedResponse, categoriesResponse] =
        await Promise.all([
          apiService.getTasks({ status: 'active' }),
          apiService.getTasks({ status: 'completed' }),
          apiService.getCategories(),
        ]);

      // Combine both arrays and sort by creation date for consistent ordering
      const serverTasks = [
        ...activeResponse.tasks,
        ...completedResponse.tasks,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const serverCategories = categoriesResponse.categories;

      // Detect conflicts
      await this.detectAndHandleConflicts(
        localTasks,
        serverTasks,
        localCategories,
        serverCategories
      );

      // Store server data (conflicts will be resolved separately)
      await Promise.all([
        offlineStorage.storeTasks(serverTasks),
        offlineStorage.storeCategories(serverCategories),
      ]);
    } catch (error) {
      console.error('Failed to refresh data from server:', error);
      throw error;
    }
  }

  private async detectAndHandleConflicts(
    localTasks: Task[],
    serverTasks: Task[],
    localCategories: Category[],
    serverCategories: Category[]
  ): Promise<void> {
    // Create maps for efficient lookup
    const localTaskMap = new Map(localTasks.map((task) => [task.id, task]));
    const localCategoryMap = new Map(
      localCategories.map((cat) => [cat.id, cat])
    );

    // Check for task conflicts
    for (const serverTask of serverTasks) {
      const localTask = localTaskMap.get(serverTask.id);
      if (localTask) {
        const conflict = conflictResolver.detectTaskConflict(
          localTask,
          serverTask
        );
        if (conflict) {
          // For now, use auto-resolution with last-write-wins
          // In the future, this could prompt the user for resolution
          try {
            const resolvedTask = conflictResolver.autoResolveConflict(
              conflict.id
            );
            console.log(
              `Auto-resolved task conflict for ${serverTask.title}:`,
              resolvedTask
            );
          } catch (error) {
            console.error('Failed to auto-resolve task conflict:', error);
            // Add to conflict queue for manual resolution
            conflictResolver.addConflict(conflict);
          }
        }
      }
    }

    // Check for category conflicts
    for (const serverCategory of serverCategories) {
      const localCategory = localCategoryMap.get(serverCategory.id);
      if (localCategory) {
        const conflict = conflictResolver.detectCategoryConflict(
          localCategory,
          serverCategory
        );
        if (conflict) {
          // For now, use auto-resolution with last-write-wins
          try {
            const resolvedCategory = conflictResolver.autoResolveConflict(
              conflict.id
            );
            console.log(
              `Auto-resolved category conflict for ${serverCategory.name}:`,
              resolvedCategory
            );
          } catch (error) {
            console.error('Failed to auto-resolve category conflict:', error);
            // Add to conflict queue for manual resolution
            conflictResolver.addConflict(conflict);
          }
        }
      }
    }
  }

  // Utility methods
  async clearOfflineData(): Promise<void> {
    await offlineStorage.clear();
    await this.updateStatus();
  }

  async getStorageInfo() {
    return await offlineStorage.getStorageInfo();
  }

  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  // Force network check and sync
  async forceSync(): Promise<void> {
    const isOnline = await networkStatus.checkNow();
    await this.updateStatus({ isOnline });

    if (isOnline) {
      await this.sync();
    }
  }

  // Conflict management methods
  getConflicts(): ConflictData[] {
    return conflictResolver.getConflicts();
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    try {
      const resolvedData = conflictResolver.resolveConflict({
        id: conflictId,
        resolution,
        mergedData,
      });

      // Update the resolved data in offline storage
      if ('title' in resolvedData) {
        // It's a task
        await offlineStorage.storeTask(resolvedData as Task);
      } else {
        // It's a category
        await offlineStorage.storeCategory(resolvedData as Category);
      }

      // Try to sync the resolved data to server
      if (this._status.isOnline) {
        await this.sync();
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  async resolveAllConflicts(
    strategy: 'local' | 'server' | 'auto' = 'auto'
  ): Promise<void> {
    const conflicts = conflictResolver.getConflicts();

    for (const conflict of conflicts) {
      try {
        let resolvedData: Task | Category;

        if (strategy === 'auto') {
          // Use smart merge for auto resolution
          const mergedData = conflictResolver.createSmartMerge(conflict);
          resolvedData = conflictResolver.resolveConflict({
            id: conflict.id,
            resolution: 'merge',
            mergedData,
          });
        } else {
          resolvedData = conflictResolver.resolveConflict({
            id: conflict.id,
            resolution: strategy,
          });
        }

        // Update the resolved data in offline storage
        if ('title' in resolvedData) {
          await offlineStorage.storeTask(resolvedData as Task);
        } else {
          await offlineStorage.storeCategory(resolvedData as Category);
        }
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }

    // Try to sync all resolved data
    if (this._status.isOnline) {
      await this.sync();
    }
  }

  // Enhanced sync control
  enableAutoSync(): void {
    this.autoSyncEnabled = true;
    this.updateStatus({ autoSyncEnabled: true });

    if (this._status.isOnline) {
      this.startAutoSync();
    }
  }

  disableAutoSync(): void {
    this.autoSyncEnabled = false;
    this.stopAutoSync();
    this.updateStatus({ autoSyncEnabled: false });
  }

  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  // Get detailed sync information
  async getSyncInfo(): Promise<{
    status: SyncStatus;
    storageInfo: any;
    conflictSummary: unknown;
    networkInfo: {
      isOnline: boolean;
      lastCheck: number;
    };
  }> {
    const [storageInfo] = await Promise.all([this.getStorageInfo()]);

    return {
      status: this.status,
      storageInfo,
      conflictSummary: conflictResolver.getConflictSummary(),
      networkInfo: {
        isOnline: networkStatus.isOnline,
        lastCheck: Date.now(),
      },
    };
  }

  // Cleanup method
  destroy(): void {
    this.stopAutoSync();

    if (this.connectionRestoreTimer) {
      clearTimeout(this.connectionRestoreTimer);
      this.connectionRestoreTimer = null;
    }

    this.listeners.clear();
  }
}

export const syncManager = new SyncManagerService();
