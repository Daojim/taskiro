import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
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
  refreshTasks: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  clearError: () => void;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getTasks();
      setTasks(response.tasks);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      setError(null);
      const response = await apiService.getCategories();
      setCategories(response.categories);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch categories');
    }
  }, []);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.createTask(taskData);
        const newTask = response.task;

        // Add the new task to the local state
        setTasks((prevTasks) => [newTask, ...prevTasks]);

        return newTask;
      } catch (err: any) {
        setError(err.error?.message || 'Failed to create task');
        return null;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, taskData: UpdateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.updateTask(id, taskData);
        const updatedTask = response.task;

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? updatedTask : task))
        );

        return updatedTask;
      } catch (err: any) {
        setError(err.error?.message || 'Failed to update task');
        return null;
      }
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await apiService.deleteTask(id);

      // Remove the task from local state (it's archived, not deleted)
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

      return true;
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete task');
      return false;
    }
  }, []);

  const toggleTaskCompletion = useCallback(
    async (id: string): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.toggleTaskCompletion(id);
        const updatedTask = response.task;

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? updatedTask : task))
        );

        return updatedTask;
      } catch (err: any) {
        setError(err.error?.message || 'Failed to toggle task completion');
        return null;
      }
    },
    []
  );

  // Load initial data
  useEffect(() => {
    refreshTasks();
    refreshCategories();
  }, [refreshTasks, refreshCategories]);

  return {
    tasks,
    categories,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks,
    refreshCategories,
    clearError,
  };
};
