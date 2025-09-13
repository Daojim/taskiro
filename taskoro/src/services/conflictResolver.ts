import type { Task, Category } from '../types/task';

export interface ConflictData {
  id: string;
  type: 'task' | 'category';
  localVersion: Task | Category;
  serverVersion: Task | Category;
  conflictFields: string[];
  timestamp: number;
}

export interface ConflictResolution {
  id: string;
  resolution: 'local' | 'server' | 'merge';
  mergedData?: Partial<Task | Category>;
}

class ConflictResolverService {
  private conflicts: Map<string, ConflictData> = new Map();
  private listeners: Set<(conflicts: ConflictData[]) => void> = new Set();

  // Detect conflicts between local and server versions
  detectTaskConflict(localTask: Task, serverTask: Task): ConflictData | null {
    const conflictFields: string[] = [];

    // Check if both versions were modified after the last sync
    const localModified = new Date(localTask.updatedAt).getTime();
    const serverModified = new Date(serverTask.updatedAt).getTime();

    // If server version is newer and different, check for conflicts
    if (Math.abs(localModified - serverModified) > 1000) {
      // 1 second tolerance
      // Check each field for differences
      if (localTask.title !== serverTask.title) conflictFields.push('title');
      if (localTask.description !== serverTask.description)
        conflictFields.push('description');
      if (localTask.dueDate !== serverTask.dueDate)
        conflictFields.push('dueDate');
      if (localTask.dueTime !== serverTask.dueTime)
        conflictFields.push('dueTime');
      if (localTask.priority !== serverTask.priority)
        conflictFields.push('priority');
      if (localTask.status !== serverTask.status) conflictFields.push('status');
      if (localTask.categoryId !== serverTask.categoryId)
        conflictFields.push('categoryId');

      if (conflictFields.length > 0) {
        return {
          id: localTask.id,
          type: 'task',
          localVersion: localTask,
          serverVersion: serverTask,
          conflictFields,
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  detectCategoryConflict(
    localCategory: Category,
    serverCategory: Category
  ): ConflictData | null {
    const conflictFields: string[] = [];

    // Check if both versions were modified after the last sync
    const localModified = new Date(localCategory.createdAt).getTime();
    const serverModified = new Date(serverCategory.createdAt).getTime();

    // If server version is newer and different, check for conflicts
    if (Math.abs(localModified - serverModified) > 1000) {
      // 1 second tolerance
      // Check each field for differences
      if (localCategory.name !== serverCategory.name)
        conflictFields.push('name');
      if (localCategory.color !== serverCategory.color)
        conflictFields.push('color');

      if (conflictFields.length > 0) {
        return {
          id: localCategory.id,
          type: 'category',
          localVersion: localCategory,
          serverVersion: serverCategory,
          conflictFields,
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // Add conflict to the queue
  addConflict(conflict: ConflictData): void {
    this.conflicts.set(conflict.id, conflict);
    this.notifyListeners();
  }

  // Get all pending conflicts
  getConflicts(): ConflictData[] {
    return Array.from(this.conflicts.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  // Get specific conflict by ID
  getConflict(id: string): ConflictData | undefined {
    return this.conflicts.get(id);
  }

  // Resolve conflict with user choice
  resolveConflict(resolution: ConflictResolution): Task | Category {
    const conflict = this.conflicts.get(resolution.id);
    if (!conflict) {
      throw new Error(`Conflict not found: ${resolution.id}`);
    }

    let resolvedData: Task | Category;

    switch (resolution.resolution) {
      case 'local':
        resolvedData = conflict.localVersion;
        break;
      case 'server':
        resolvedData = conflict.serverVersion;
        break;
      case 'merge':
        if (!resolution.mergedData) {
          throw new Error('Merged data required for merge resolution');
        }
        resolvedData = {
          ...conflict.serverVersion,
          ...resolution.mergedData,
          updatedAt: new Date().toISOString(),
        };
        break;
      default:
        throw new Error(`Invalid resolution type: ${resolution.resolution}`);
    }

    // Remove conflict from queue
    this.conflicts.delete(resolution.id);
    this.notifyListeners();

    return resolvedData;
  }

  // Auto-resolve conflicts using last-write-wins strategy
  autoResolveConflict(conflictId: string): Task | Category {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    const localTime = new Date(
      'updatedAt' in conflict.localVersion
        ? conflict.localVersion.updatedAt
        : conflict.localVersion.createdAt
    ).getTime();
    const serverTime = new Date(
      'updatedAt' in conflict.serverVersion
        ? conflict.serverVersion.updatedAt
        : conflict.serverVersion.createdAt
    ).getTime();

    // Use the version with the latest timestamp
    const resolvedData =
      serverTime > localTime ? conflict.serverVersion : conflict.localVersion;

    // Remove conflict from queue
    this.conflicts.delete(conflictId);
    this.notifyListeners();

    return resolvedData;
  }

  // Smart merge for tasks (combines non-conflicting changes)
  createSmartMerge(conflict: ConflictData): Partial<Task | Category> {
    if (conflict.type === 'task') {
      const local = conflict.localVersion as Task;
      const server = conflict.serverVersion as Task;
      const merged: Partial<Task> = { ...server };

      // For each field, choose the most recent non-empty value
      if (conflict.conflictFields.includes('title')) {
        merged.title = local.title || server.title;
      }
      if (conflict.conflictFields.includes('description')) {
        merged.description = local.description || server.description;
      }
      if (conflict.conflictFields.includes('dueDate')) {
        // Prefer local due date if it's more recent
        const localTime = new Date(local.updatedAt).getTime();
        const serverTime = new Date(server.updatedAt).getTime();
        merged.dueDate =
          localTime > serverTime ? local.dueDate : server.dueDate;
      }
      if (conflict.conflictFields.includes('priority')) {
        // Prefer higher priority
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        const localPriority = priorityOrder[local.priority];
        const serverPriority = priorityOrder[server.priority];
        merged.priority =
          localPriority > serverPriority ? local.priority : server.priority;
      }
      if (conflict.conflictFields.includes('status')) {
        // Prefer completed status over active
        if (local.status === 'completed' || server.status === 'completed') {
          merged.status = 'completed';
          merged.completedAt = local.completedAt || server.completedAt;
        } else {
          merged.status = server.status;
        }
      }

      return merged;
    } else {
      const local = conflict.localVersion as Category;
      const server = conflict.serverVersion as Category;
      const merged: Partial<Category> = { ...server };

      // For categories, prefer local changes for name and color
      if (conflict.conflictFields.includes('name')) {
        merged.name = local.name || server.name;
      }
      if (conflict.conflictFields.includes('color')) {
        merged.color = local.color || server.color;
      }

      return merged;
    }
  }

  // Clear all conflicts
  clearConflicts(): void {
    this.conflicts.clear();
    this.notifyListeners();
  }

  // Subscribe to conflict changes
  addListener(listener: (conflicts: ConflictData[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const conflicts = this.getConflicts();
    this.listeners.forEach((listener) => {
      try {
        listener(conflicts);
      } catch (error) {
        console.error('Error in conflict resolver listener:', error);
      }
    });
  }

  // Get conflict summary for UI
  getConflictSummary(): {
    total: number;
    tasks: number;
    categories: number;
    oldestConflict: number | null;
  } {
    const conflicts = this.getConflicts();
    return {
      total: conflicts.length,
      tasks: conflicts.filter((c) => c.type === 'task').length,
      categories: conflicts.filter((c) => c.type === 'category').length,
      oldestConflict: conflicts.length > 0 ? conflicts[0].timestamp : null,
    };
  }
}

export const conflictResolver = new ConflictResolverService();
