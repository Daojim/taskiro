import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import type { Task } from '../types/task';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { categories, error, clearError } = useTasks();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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

          {/* Task List */}
          <TaskList
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onError={handleError}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
