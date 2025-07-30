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
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Taskiro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Welcome, {user?.email}
              </span>
              <ThemeToggle />
              <button
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Categories
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error from useTasks hook */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={handleClearError}
                  className="text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Task Input Component */}
          <div className="mb-8">
            <TaskInput
              onTaskCreated={handleTaskCreated}
              categories={categories}
              onError={handleError}
            />
          </div>

          {/* View Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4 mr-2" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Calendar
                </button>
              </div>
            </div>
          </div>

          {/* View Content */}
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
