import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTaskContext } from '../contexts/TaskContext';
import { useTheme } from '../hooks/useTheme';
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
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { networkStatus } from '../services/networkStatus';
import type { Task, CreateTaskRequest } from '../types/task';

type ViewMode = 'list' | 'calendar';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const {
    tasks,
    categories,
    isLoading,
    refreshCategories,
    refreshTasks,
    createTask,
  } = useTaskContext();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Helper to show notifications without overriding offline status
  const showNotification = (
    type: 'success' | 'error',
    message: string,
    autoHide = true
  ) => {
    setNotification({ type, message });
    if (autoHide) {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Network status monitoring for notifications
  useEffect(() => {
    const unsubscribe = networkStatus.addListener((isOnline) => {
      if (!isOnline) {
        setNotification({
          type: 'error',
          message:
            "You're offline. Changes will sync when connection is restored.",
        });
        // Keep offline notification persistent (don't auto-dismiss)
      } else {
        setNotification({
          type: 'success',
          message: 'Connection restored. Your changes will sync automatically.',
        });
        // Auto-dismiss online notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
    });

    return unsubscribe;
  }, []);

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
      // No refresh needed - shared context updates all components automatically
      showNotification('success', 'Task created successfully!');
    } catch {
      handleError('Failed to create task');
    }
  };

  const handleTaskUpdated = async (_task: Task) => {
    try {
      showNotification('success', 'Task updated successfully!');
    } catch {
      handleError('Failed to update task');
    }
  };

  const handleTaskDeleted = async (_taskId: string) => {
    try {
      // No refresh needed - shared context updates all components automatically
      showNotification('success', 'Task archived successfully!');
    } catch {
      handleError('Failed to delete task');
    }
  };

  const handleError = (errorMessage: string) => {
    showNotification('error', errorMessage);
  };

  const handleCategoryChange = () => {
    refreshCategories();
    showNotification('success', 'Categories updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 font-sans transition-colors duration-300">
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
          borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
          zIndex: 40,
          display: 'block',
        }}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            width: '75%',
            minWidth: '320px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-blue-600 dark:text-amber-400 m-0">
                Taskiro
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <SyncStatusIndicator showDetails={true} />
              <span className="text-sm text-gray-600 dark:text-slate-300">
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
        className="mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          paddingTop: '80px',
          width: '75%',
          minWidth: '320px',
          maxWidth: '1400px',
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Task Input Component */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
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

      {/* Fixed Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-lg p-4 min-w-80 shadow-lg transition-all duration-300 transform ${
            notification.type === 'success'
              ? 'bg-green-100 border-2 border-green-500 text-green-800'
              : 'bg-red-100 border-2 border-red-500 text-red-800'
          }`}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            pointerEvents: 'auto',
            maxWidth: '400px',
            backgroundColor:
              notification.type === 'success' ? '#dcfce7' : '#fecaca', // green-100 : red-100
            borderColor:
              notification.type === 'success' ? '#22c55e' : '#ef4444', // green-500 : red-500
            color: notification.type === 'success' ? '#166534' : '#991b1b', // green-800 : red-800
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
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
                  className="w-5 h-5 text-red-500 mr-3"
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
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {notification.message}
              </span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

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
