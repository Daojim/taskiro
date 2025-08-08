import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 focus-ring transition-all duration-250 hover-scale shadow-sm hover:shadow-md"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === 'light' ? (
          <SunIcon className="w-5 h-5 text-yellow-500 transition-all duration-200 ease-in-out" />
        ) : (
          <MoonIcon className="w-5 h-5 text-blue-400 transition-all duration-200 ease-in-out" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
