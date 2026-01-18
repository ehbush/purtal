import { Link, useLocation } from 'react-router-dom';
import { Settings, Home, Moon, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import Clock from './Clock';

export default function Layout({ children }) {
  const location = useLocation();
  const { settings, toggleTheme } = useSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg transition-colors">
      <nav className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold bg-gradient-purtal bg-clip-text text-transparent dark:text-white transition-colors">
              {settings.title || 'Purtal'}
            </Link>
            <div className="flex items-center gap-4">
              <Clock />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {settings.theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-gradient-purtal text-white shadow-lg shadow-primary-500/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Home className="w-5 h-5 inline mr-2" />
                Home
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-gradient-purtal text-white shadow-lg shadow-primary-500/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 inline mr-2" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
