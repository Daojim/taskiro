import React, { useState, useMemo, useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import type { Task, CreateTaskRequest } from '../types/task';

interface CalendarViewProps {
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onTaskCreated?: (task: Task) => void;
  onError?: (error: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  onTaskUpdated,
  onTaskDeleted,
  onTaskCreated,
  onError,
}) => {
  const {
    tasks,
    categories,
    isLoading,
    error,
    updateTask,
    deleteTask,
    createTask,
    toggleTaskCompletion,
  } = useTaskContext();

  // Current month/year state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get tasks for the current month
  const monthTasks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return tasks.filter((task) => {
      if (!task.dueDate) return false;

      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === year &&
        taskDate.getMonth() === month &&
        task.status !== 'archived'
      );
    });
  }, [tasks, currentDate]);

  // Handle month navigation
  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Handle task operations
  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const updatedTask = await updateTask(taskId, updates);
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
      } catch {
        if (onError) {
          onError('Failed to update task');
        }
      }
    },
    [updateTask, onTaskUpdated, onError]
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      try {
        const success = await deleteTask(taskId);
        if (success && onTaskDeleted) {
          onTaskDeleted(taskId);
        }
      } catch {
        if (onError) {
          onError('Failed to delete task');
        }
      }
    },
    [deleteTask, onTaskDeleted, onError]
  );

  const handleTaskCreate = useCallback(
    async (taskData: Partial<Task>) => {
      try {
        // Convert to CreateTaskRequest format
        const createRequest: CreateTaskRequest = {
          title: taskData.title || '',
          description: taskData.description,
          dueDate: taskData.dueDate,
          dueTime: taskData.dueTime,
          priority: taskData.priority,
          categoryId: taskData.categoryId,
        };

        const newTask = await createTask(createRequest);
        if (newTask && onTaskCreated) {
          onTaskCreated(newTask);
        }
      } catch {
        if (onError) {
          onError('Failed to create task');
        }
      }
    },
    [createTask, onTaskCreated, onError]
  );

  const handleToggleCompletion = useCallback(
    async (taskId: string) => {
      try {
        const updatedTask = await toggleTaskCompletion(taskId);
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
      } catch {
        if (onError) {
          onError('Failed to update task completion status');
        }
      }
    },
    [toggleTaskCompletion, onTaskUpdated, onError]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading calendar...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <CalendarGrid
        currentDate={currentDate}
        tasks={monthTasks}
        categories={categories}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onTaskCreate={handleTaskCreate}
        onToggleCompletion={handleToggleCompletion}
        onError={onError}
      />
    </div>
  );
};

export default CalendarView;
