import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

export const ThemeToggle: React.FC<{ isDark: boolean; toggle: () => void }> = ({ isDark, toggle }) => {
  return (
    <button
      onClick={toggle}
      aria-pressed={isDark}
      className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tumbi-500 ${isDark ? 'bg-gray-700' : 'bg-yellow-300'}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-5 text-xs text-white opacity-0 transition-opacity duration-200`}></span>
      <span className={`absolute left-2 ${isDark ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <MoonIcon className="w-4 h-4 text-white" />
      </span>
      <span className={`absolute right-2 ${isDark ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <SunIcon className="w-4 h-4 text-white" />
      </span>

      <span
        className={`transform transition-transform duration-300 ease-in-out translate-x-0 ${isDark ? 'translate-x-6' : ''} inline-block w-6 h-6 bg-white rounded-full shadow-md m-1`}
      />
    </button>
  );
};

export default ThemeToggle;
