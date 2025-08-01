import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import {
  ListBulletIcon,
  CalendarDaysIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import CalendarView from './CalendarView';
import CategoryManager from './CategoryManager';
import ThemeToggle from './ThemeToggle';
import type { Task, CreateTaskRequest } from '../types/task';

type ViewMode = 'list' | 'calendar';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    tasks,
    categories,
    isLoading,
    error,
    clearError,
    refreshCategories,
    refreshTasks,
    createTask,
  } = useTasks();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTaskCreated = async (taskData: CreateTaskRequest) => {
    try {
      await createTask(taskData);
      await refreshTasks(); // Refresh the task list
      setNotification({
        type: 'success',
        message: 'Task created successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch {
      handleError('Failed to create task');
    }
  };

  const handleTaskUpdated = async (_task: Task) => {
    try {
      await refreshTasks(); // Refresh the task list
      setNotification({
        type: 'success',
        message: 'Task updated successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch {
      handleError('Failed to update task');
    }
  };

  const handleTaskDeleted = async (_taskId: string) => {
    try {
      await refreshTasks(); // Refresh the task list
      setNotification({
        type: 'success',
        message: 'Task archived successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch {
      handleError('Failed to delete task');
    }
  };

  const handleError = (errorMessage: string) => {
    setNotification({ type: 'error', message: errorMessage });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleClearError = () => {
    clearError();
    setNotification(null);
  };

  const handleCategoryChange = () => {
    refreshCategories();
    setNotification({
      type: 'success',
      message: 'Categories updated successfully!',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              height: '4rem',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#2563eb',
                  margin: 0,
                }}
              >
                Taskiro
              </h1>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Welcome, {user?.email}
              </span>
              <ThemeToggle />
              <button
                onClick={() => setShowCategoryManager(true)}
                className="btn-secondary btn-sm"
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Categories
              </button>
              <button onClick={handleLogout} className="btn-danger btn-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main
        style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Notification */}
          {notification && (
            <div
              className={`${
                notification.type === 'success'
                  ? 'toast-success'
                  : 'toast-error'
              } relative animate-slide-down`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <svg
                      className="w-5 h-5 text-success-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-error-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-body">{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="btn-ghost btn-sm ml-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error from useTasks hook */}
          {error && (
            <div className="toast-error relative animate-slide-down">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-error-500 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-body">{error}</span>
                </div>
                <button
                  onClick={handleClearError}
                  className="btn-ghost btn-sm ml-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Task Input Component */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
            }}
          >
            <TaskInput
              onTaskCreated={handleTaskCreated}
              categories={categories}
              onError={handleError}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-center">
            <div className="card p-1 flex animate-fade-in">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                  viewMode === 'list'
                    ? 'bg-primary-50 dark:bg-primary-900-20 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700-50'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                  viewMode === 'calendar'
                    ? 'bg-primary-50 dark:bg-primary-900-20 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700-50'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Calendar
              </button>
            </div>
          </div>

          {/* View Content */}
          <div className="animate-fade-in">
            {viewMode === 'list' ? (
              <TaskList
                tasks={tasks}
                categories={categories}
                isLoading={isLoading}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onError={handleError}
                onRefresh={refreshTasks}
              />
            ) : (
              <CalendarView
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onTaskCreated={handleTaskCreated}
                onError={handleError}
              />
            )}
          </div>
        </div>
      </main>

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
};

export default Dashboard;
