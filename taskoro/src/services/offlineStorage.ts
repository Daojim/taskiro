import type { Task, Category } from '../types/task';

interface SyncAction {
  id: string;
  type:
    | 'CREATE_TASK'
    | 'UPDATE_TASK'
    | 'DELETE_TASK'
    | 'TOGGLE_TASK_COMPLETION'
    | 'CREATE_CATEGORY'
    | 'UPDATE_CATEGORY'
    | 'DELETE_CATEGORY';
  data: any;
  timestamp: number;
  retryCount: number;
}

// Interface for offline data structure (for future use)
// interface OfflineData {
//   tasks: Task[];
//   categories: Category[];
//   syncQueue: SyncAction[];
//   lastSync: number;
// }

class OfflineStorageService {
  private dbName = 'taskoro-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('userId', 'userId', { unique: false });
          tasksStore.createIndex('status', 'status', { unique: false });
          tasksStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // Create categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', {
            keyPath: 'id',
          });
          categoriesStore.createIndex('userId', 'userId', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Task storage methods
  async storeTasks(tasks: Task[]): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    // Clear existing tasks first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Store new tasks
    const promises = tasks.map(
      (task) =>
        new Promise<void>((resolve, reject) => {
          const request = store.add(task);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
  }

  async getTasks(): Promise<Task[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async storeTask(task: Task): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.put(task);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    return new Promise((resolve, reject) => {
      const request = store.delete(taskId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Category storage methods
  async storeCategories(categories: Category[]): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');

    // Clear existing categories first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Store new categories
    const promises = categories.map(
      (category) =>
        new Promise<void>((resolve, reject) => {
          const request = store.add(category);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
  }

  async getCategories(): Promise<Category[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async storeCategory(category: Category): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');

    return new Promise((resolve, reject) => {
      const request = store.put(category);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue methods
  async addToSyncQueue(
    action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const syncAction: SyncAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(syncAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncAction[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Sort by timestamp to process in order
        const actions = (request.result || []).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        resolve(actions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncAction(actionId: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.delete(actionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncAction(action: SyncAction): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.put(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Metadata methods
  async setLastSyncTime(timestamp: number): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'lastSync', value: timestamp });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(): Promise<number | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.get('lastSync');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clear(): Promise<void> {
    const db = this.ensureDB();
    const storeNames = ['tasks', 'categories', 'syncQueue', 'metadata'];

    const promises = storeNames.map(
      (storeName) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
  }

  async getStorageInfo(): Promise<{
    tasksCount: number;
    categoriesCount: number;
    syncQueueCount: number;
    lastSync: number | null;
  }> {
    const [tasks, categories, syncQueue, lastSync] = await Promise.all([
      this.getTasks(),
      this.getCategories(),
      this.getSyncQueue(),
      this.getLastSyncTime(),
    ]);

    return {
      tasksCount: tasks.length,
      categoriesCount: categories.length,
      syncQueueCount: syncQueue.length,
      lastSync,
    };
  }
}

export const offlineStorage = new OfflineStorageService();
