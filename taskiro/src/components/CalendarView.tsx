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
        // Convert to CreateTaskRequest format - only include defined values
        const createRequest: CreateTaskRequest = {
          title: taskData.title || '',
          priority: taskData.priority || 'medium',
        };

        // Only add optional fields if they have values
        if (taskData.description && taskData.description.trim()) {
          createRequest.description = taskData.description.trim();
        }
        if (taskData.dueDate) {
          // Convert YYYY-MM-DD to proper ISO8601 format at noon UTC to avoid timezone issues
          createRequest.dueDate = `${taskData.dueDate}T12:00:00.000Z`;
        }
        if (taskData.dueTime) {
          createRequest.dueTime = taskData.dueTime;
        }
        if (taskData.categoryId) {
          createRequest.categoryId = taskData.categoryId;
        }

        console.log('Creating task with data:', createRequest);
        const newTask = await createTask(createRequest);
        // Don't call onTaskCreated as it might be causing the double call
        // The task is already added to state in the createTask function
        console.log('Task created successfully:', newTask);
      } catch (error) {
        console.error('Task creation error details:', error);
        // Log the full error response to understand what's failing
        if (error && typeof error === 'object') {
          const axiosError = error as any;
          if (axiosError.response) {
            console.error(
              'Server response status:',
              axiosError.response.status
            );
            console.error('Server response data:', axiosError.response.data);
            console.error(
              'Server response headers:',
              axiosError.response.headers
            );
          }
        }
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
      <div className="calendar-view__loading">
        <div className="calendar-view__loading-spinner"></div>
        <span className="calendar-view__loading-text">Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-view__error">
        <p className="calendar-view__error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="calendar-view">
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
