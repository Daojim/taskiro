import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CalendarIntegration } from './CalendarIntegration';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="app-container">
      {/* Settings Header */}
      <div className="app-nav">
        <div className="app-nav-container">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="button button--secondary button--small mr-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="app-logo">Settings</h1>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Theme: {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <main className="app-main">
        <div className="mb-8">
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Manage your account settings and integrations
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings Section */}
          <div className="card p-6">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-lg font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Theme
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Choose between light and dark mode, or let the system decide
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Integration Section */}
          <div className="card p-6">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Calendar Integration
            </h2>
            <CalendarIntegration />
          </div>

          {/* Future settings sections can be added here */}
          <div className="card p-6">
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              More Settings Coming Soon
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Additional settings and preferences will be available in future
              updates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
