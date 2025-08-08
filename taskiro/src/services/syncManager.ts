import { apiService } from './api';
import { offlineStorage } from './offlineStorage';
import { networkStatus } from './networkStatus';
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
  };
  private syncInProgress = false;
  private autoSyncEnabled = true;
  private readonly MAX_RETRY_COUNT = 3;
  // private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay (for future use)

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      await offlineStorage.init();

      // Listen to network status changes
      networkStatus.addListener(this.handleNetworkChange);

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
      // Network came back online, trigger sync
      this.sync();
    }
  };

  private async updateStatus(updates?: Partial<SyncStatus>): Promise<void> {
    const [lastSync, syncQueue] = await Promise.all([
      offlineStorage.getLastSyncTime(),
      offlineStorage.getSyncQueue(),
    ]);

    this._status = {
      ...this._status,
      lastSync,
      pendingActions: syncQueue.length,
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
    // Auto-sync every 5 minutes when online
    setInterval(
      () => {
        if (
          this._status.isOnline &&
          this.autoSyncEnabled &&
          !this.syncInProgress
        ) {
          this.sync();
        }
      },
      5 * 60 * 1000
    );
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
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new Error('Task not found in offline storage');
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
      case 'CREATE_TASK':
        await apiService.createTask(action.data);
        break;

      case 'UPDATE_TASK':
        await apiService.updateTask(action.data.id, action.data.updates);
        break;

      case 'TOGGLE_TASK_COMPLETION':
        await apiService.toggleTaskCompletion(action.data.id);
        break;

      case 'DELETE_TASK':
        await apiService.deleteTask(action.data.id);
        break;

      case 'CREATE_CATEGORY':
        await apiService.createCategory(action.data);
        break;

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
      // Refresh tasks and categories from server
      // Fetch both active and completed tasks since backend defaults to active only
      const [activeResponse, completedResponse, categoriesResponse] =
        await Promise.all([
          apiService.getTasks({ status: 'active' }),
          apiService.getTasks({ status: 'completed' }),
          apiService.getCategories(),
        ]);

      // Combine both arrays and sort by creation date for consistent ordering
      const allTasks = [
        ...activeResponse.tasks,
        ...completedResponse.tasks,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      await Promise.all([
        offlineStorage.storeTasks(allTasks),
        offlineStorage.storeCategories(categoriesResponse.categories),
      ]);
    } catch (error) {
      console.error('Failed to refresh data from server:', error);
      throw error;
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
}

export const syncManager = new SyncManagerService();
