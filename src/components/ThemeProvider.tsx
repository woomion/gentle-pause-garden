import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'pocket-pause-theme',
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from database for authenticated users or localStorage for guests
    const loadTheme = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('theme')
            .eq('user_id', user.id)
            .single();

          if (data?.theme) {
            setThemeState(data.theme as Theme);
          }
        } catch (error) {
          console.error('Failed to load theme from database:', error);
          // Fallback to localStorage
          const storedTheme = localStorage.getItem(storageKey) as Theme;
          setThemeState(storedTheme || defaultTheme);
        }
      } else {
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        setThemeState(storedTheme || defaultTheme);
      }
    };

    loadTheme();
  }, [user, storageKey, defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let resolvedTheme: 'light' | 'dark';

      if (theme === 'system') {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolvedTheme = theme;
      }

      setActualTheme(resolvedTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    };

    updateTheme();

    const handleMediaChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Save to database for authenticated users
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .update({ theme: newTheme, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to save theme to database:', error);
      }
    }

    // Always save to localStorage as backup
    localStorage.setItem(storageKey, newTheme);
  };

  const value = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};