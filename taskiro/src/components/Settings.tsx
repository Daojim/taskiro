import React from 'react';
import { CalendarIntegration } from './CalendarIntegration';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and integrations
          </p>
        </div>

        <div className="space-y-6">
          {/* Calendar Integration Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Calendar Integration
            </h2>
            <CalendarIntegration />
          </div>

          {/* Future settings sections can be added here */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              More Settings Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Additional settings and preferences will be available in future
              updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
