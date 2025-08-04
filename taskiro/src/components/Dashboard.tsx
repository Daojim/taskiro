import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTaskContext } from '../contexts/TaskContext';
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

          {/* Date Picker Test Section */}
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
            <h3
              style={{
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600',
              }}
            >
              🧪 Date Picker Test Section
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Test 1: Tailwind Classes (like modal)
                </label>
                <input
                  type="date"
                  defaultValue="2025-08-05"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  style={{ width: '140px' }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Test 2: Minimal Inline Styles
                </label>
                <input
                  type="date"
                  defaultValue="2025-08-05"
                  style={{
                    fontSize: '12px',
                    width: '140px',
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Test 3: Browser Default
                </label>
                <input
                  type="date"
                  defaultValue="2025-08-05"
                  style={{ all: 'revert', width: '140px' }}
                />
              </div>
            </div>
            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              Test which calendar buttons work here vs. in the task list. This
              helps isolate the issue.
            </p>
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
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor:
              notification.type === 'success' ? '#f0f9ff' : '#fef2f2',
            border: `3px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            padding: '16px',
            minWidth: '300px',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            color: '#1f2937',
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
