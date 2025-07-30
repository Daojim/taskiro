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
import type { Task } from '../types/task';

type ViewMode = 'list' | 'calendar';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { categories, error, clearError, refreshCategories } = useTasks();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTaskCreated = (_task: Task) => {
    setNotification({ type: 'success', message: 'Task created successfully!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTaskUpdated = (_task: Task) => {
    setNotification({ type: 'success', message: 'Task updated successfully!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTaskDeleted = (_taskId: string) => {
    setNotification({
      type: 'success',
      message: 'Task archived successfully!',
    });
    setTimeout(() => setNotification(null), 3000);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="container-app">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-heading-3 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-bold">
                Taskiro
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-body hidden sm:block">
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

      <main className="container-app section-spacing">
        <div className="content-spacing">
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
          <div className="card card-elevated animate-fade-in">
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
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                  viewMode === 'calendar'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onError={handleError}
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
