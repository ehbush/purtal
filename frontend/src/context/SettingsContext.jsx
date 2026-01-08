import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    title: 'Purtal',
    theme: localStorage.getItem('purtal-theme') || 'dark',
    layout: 'grid',
    healthCheck: {
      serviceFrequency: 30,
      serviceTimeout: 5000,
      clientFrequency: 60,
      clientTimeout: 3
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('purtal-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/config/settings');
      const loadedSettings = {
        title: 'Purtal',
        theme: localStorage.getItem('purtal-theme') || 'dark',
        layout: 'grid',
        healthCheck: {
          serviceFrequency: 30,
          serviceTimeout: 5000,
          clientFrequency: 60,
          clientTimeout: 3
        },
        ...data
      };
      setSettings(loadedSettings);
      // Apply theme - use 'dark' class for Tailwind dark mode
      if (loadedSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updated = await api.put('/config/settings', newSettings);
      // Use functional update to ensure we have the latest state
      setSettings(prevSettings => {
        const mergedSettings = { ...prevSettings, ...updated, ...newSettings };
        
        // Handle theme change - use 'dark' class for Tailwind dark mode
        if (newSettings.theme) {
          localStorage.setItem('purtal-theme', newSettings.theme);
          if (newSettings.theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            document.documentElement.classList.add('dark');
          }
        }
        
        return mergedSettings;
      });
      
      // Return the merged settings (we need to get it from state after update)
      return { ...settings, ...updated, ...newSettings };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const toggleTheme = () => {
    setSettings(prevSettings => {
      const newTheme = prevSettings.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('purtal-theme', newTheme);
      
      // Apply theme immediately
      if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
      
      const updatedSettings = { ...prevSettings, theme: newTheme };
      
      // Also update in backend (silently fail if it doesn't work)
      api.put('/config/settings', { theme: newTheme }).catch(err => {
        console.error('Error updating theme in backend:', err);
        // Don't throw - theme toggle should work even if backend update fails
      });
      
      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleTheme, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
