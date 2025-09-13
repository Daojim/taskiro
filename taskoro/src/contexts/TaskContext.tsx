import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTasks } from '../hooks/useTasks';
import type {
  Task,
  Category,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task';

interface TaskContextType {
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
    conflicts: number;
    autoSyncEnabled: boolean;
  };
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
  getSyncInfo: () => Promise<any>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const taskHookData = useTasks();

  return (
    <TaskContext.Provider value={taskHookData}>{children}</TaskContext.Provider>
  );
};

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
