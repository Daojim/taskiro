import { useState, useEffect, useCallback, useRef } from 'react';
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
  restoreTask: (id: string) => Promise<Task | null>;
  refreshTasks: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing tasks and categories
 * Provides CRUD operations, optimistic updates, and centralized error handling
 *
 * @returns {UseTasksReturn} Object containing tasks, categories, loading state, and CRUD functions
 */
export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      };
      errorMessage =
        apiError.error?.message || apiError.message || defaultMessage;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    setError(errorMessage);
    console.error(defaultMessage, err);
    return errorMessage;
  }, []);

  const refreshTasks = useCallback(
    async (retryCount = 0) => {
      try {
        setIsLoading(true);
        setError(null);

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

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetched tasks:', {
            active: activeResponse.tasks.length,
            completed: completedResponse.tasks.length,
            total: allTasks.length,
            statuses: allTasks.map((t) => t.status),
          });
        }

        setTasks(allTasks);
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
      }
    },
    [handleError]
  );

  const refreshCategories = useCallback(async () => {
    try {
      setError(null);
      const response = await apiService.getCategories();
      setCategories(response.categories);
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch categories');
    }
  }, [handleError]);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.createTask(taskData);
        const newTask = response.task;

        // Add the new task to the local state
        setTasks((prevTasks) => [newTask, ...prevTasks]);

        return newTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to create task');
        return null;
      }
    },
    [handleError]
  );

  const updateTask = useCallback(
    async (id: string, taskData: UpdateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.updateTask(id, taskData);
        const updatedTask = response.task;
        console.log('useTasks updateTask success:', { id, updatedTask });

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? updatedTask : task))
        );

        return updatedTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to update task');
        return null;
      }
    },
    [handleError]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await apiService.deleteTask(id);

        // Remove the task from local state (it's archived, not deleted)
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

        return true;
      } catch (err: unknown) {
        handleError(err, 'Failed to delete task');
        return false;
      }
    },
    [handleError]
  );

  const toggleTaskCompletion = useCallback(
    async (id: string): Promise<Task | null> => {
      // Prevent duplicate calls for the same task
      if (pendingCallsRef.current.has(id)) {
        console.log(`Skipping duplicate toggle call for task ${id}`);
        return null;
      }

      pendingCallsRef.current.add(id);

      // Optimistic update - create new task object to minimize re-renders
      let originalTask: Task | undefined;
      setTasks((prevTasks) => {
        const taskIndex = prevTasks.findIndex((task) => task.id === id);
        if (taskIndex === -1) return prevTasks;

        originalTask = prevTasks[taskIndex];
        const newTask = {
          ...originalTask,
          status:
            originalTask.status.toLowerCase() === 'completed'
              ? 'active'
              : 'completed',
        } as Task;

        // Create new array with only the changed task replaced
        const newTasks = [...prevTasks];
        newTasks[taskIndex] = newTask;
        return newTasks;
      });

      try {
        setError(null);
        const response = await apiService.toggleTaskCompletion(id);
        const updatedTask = response.task;

        // Update with actual server response - targeted update
        setTasks((prevTasks) => {
          const taskIndex = prevTasks.findIndex((task) => task.id === id);
          if (taskIndex === -1) return prevTasks;

          const newTasks = [...prevTasks];
          newTasks[taskIndex] = updatedTask;
          return newTasks;
        });

        return updatedTask;
      } catch (err: unknown) {
        // Revert optimistic update on error - targeted update
        if (originalTask) {
          setTasks((prevTasks) => {
            const taskIndex = prevTasks.findIndex((task) => task.id === id);
            if (taskIndex === -1) return prevTasks;

            const newTasks = [...prevTasks];
            newTasks[taskIndex] = originalTask!;
            return newTasks;
          });
        }

        handleError(err, 'Failed to toggle task completion');
        return null;
      } finally {
        // Remove from pending calls
        pendingCallsRef.current.delete(id);
      }
    },
    [handleError]
  );

  const restoreTask = useCallback(
    async (id: string): Promise<Task | null> => {
      try {
        setError(null);
        const response = await apiService.restoreTask(id);
        const restoredTask = response.task;

        // Add the restored task back to local state
        setTasks((prevTasks) => [restoredTask, ...prevTasks]);

        return restoredTask;
      } catch (err: unknown) {
        handleError(err, 'Failed to restore task');
        return null;
      }
    },
    [handleError]
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
    restoreTask,
    refreshTasks,
    refreshCategories,
    clearError,
  };
};
