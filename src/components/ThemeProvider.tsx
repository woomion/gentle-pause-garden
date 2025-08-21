import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark' | 'system';
type ColorTheme = 'lavender' | 'sporty';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
  colorTheme: 'lavender',
  setColorTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'sporty',
  storageKey = 'pocket-pause-theme',
  colorStorageKey = 'pocket-pause-color-theme',
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  storageKey?: string;
  colorStorageKey?: string;
}) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme | null>(null); // Start with null to prevent flash
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme from database for authenticated users or localStorage for guests
    const loadTheme = async () => {
      // First, try to load from localStorage synchronously to prevent flash
      const storedColorTheme = localStorage.getItem(colorStorageKey) as ColorTheme;
      if (storedColorTheme) {
        setColorThemeState(storedColorTheme);
      } else {
        setColorThemeState('sporty'); // Default fallback
      }

      if (user) {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('theme, color_theme')
            .eq('user_id', user.id)
            .single();

          if (data?.theme) {
            setThemeState(data.theme as Theme);
          }
          if (data?.color_theme) {
            setColorThemeState(data.color_theme as ColorTheme);
          }
        } catch (error) {
          console.error('Failed to load theme from database:', error);
          // Fallback already set above
          const storedTheme = localStorage.getItem(storageKey) as Theme;
          setThemeState(storedTheme || defaultTheme);
        }
      } else {
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        setThemeState(storedTheme || defaultTheme);
        // Color theme already set above
      }
      
      setIsLoaded(true);
    };

    loadTheme();
  }, [user, storageKey, colorStorageKey, defaultTheme]);

  useEffect(() => {
    // Only apply theme changes after initial load and when colorTheme is not null
    if (!isLoaded || colorTheme === null) return;

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
      
      // Set color theme
      root.setAttribute('data-color-theme', colorTheme);
      
      // Update PWA theme color dynamically
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const themeColor = colorTheme === 'sporty' ? '#FF9E1B' : '#CAB6F7';
        metaThemeColor.setAttribute('content', themeColor);
      }
    };

    updateTheme();

    const handleMediaChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, colorTheme, isLoaded]);

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

  const setColorTheme = async (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);

    // Save to database for authenticated users
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .update({ color_theme: newColorTheme, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to save color theme to database:', error);
      }
    }

    // Always save to localStorage as backup
    localStorage.setItem(colorStorageKey, newColorTheme);
  };

  const value = {
    theme,
    setTheme,
    actualTheme,
    colorTheme: colorTheme || 'sporty', // Provide fallback to prevent null issues
    setColorTheme,
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