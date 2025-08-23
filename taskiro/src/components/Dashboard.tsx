import React, { useState, useEffect } from 'react';
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

import { networkStatus } from '../services/networkStatus';
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
    <div className="app-container">
      <nav className="app-nav">
        <div className="app-nav-container">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="app-logo">Taskiro</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="welcome-text">Welcome, {user?.email}</span>
              <ThemeToggle />
              <button
                onClick={() => setShowCategoryManager(true)}
                className="button button--secondary button--small"
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Categories
              </button>
              <button
                onClick={handleLogout}
                className="button button--danger button--small"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <div className="flex flex-col gap-6">
          {/* Task Input Component */}
          <div className="card p-6">
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
                    ? 'view-toggle-active'
                    : 'view-toggle-inactive'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                  viewMode === 'calendar'
                    ? 'view-toggle-active'
                    : 'view-toggle-inactive'
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
          className={`app-notification ${
            notification.type === 'success' ? 'success' : 'error'
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
              <span className="notification-message">
                {notification.message}
              </span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="notification-close"
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
