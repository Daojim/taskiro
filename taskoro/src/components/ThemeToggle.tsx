import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === 'light' ? (
          <SunIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
        ) : (
          <MoonIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
