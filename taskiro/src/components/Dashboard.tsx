import React, { useState } from 'react';
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
      // No refresh needed - shared context updates all components automatically
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

  const handleCategoryChange = () => {
    refreshCategories();
    setNotification({
      type: 'success',
      message: 'Categories updated successfully!',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-300">
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
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
              <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 m-0">
                Taskiro
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
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
          className={`fixed top-5 right-5 z-50 rounded-lg p-4 min-w-80 shadow-lg transition-colors duration-300 ${
            notification.type === 'success'
              ? 'bg-sky-50 dark:bg-sky-900/20 border-3 border-green-500 dark:border-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-3 border-red-500 dark:border-red-400'
          }`}
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
