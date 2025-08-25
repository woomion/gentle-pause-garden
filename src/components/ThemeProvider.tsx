import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark' | 'system';
type ColorTheme = 'lavender' | 'sporty' | 'minimal';

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
  
  // Initialize theme and colorTheme from localStorage immediately to prevent flash
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme;
      return stored || defaultTheme;
    }
    return defaultTheme;
  };
  
  const getInitialColorTheme = (): ColorTheme => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(colorStorageKey) as ColorTheme;
      return stored || defaultColorTheme;
    }
    return defaultColorTheme;
  };
  
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(getInitialColorTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme from database for authenticated users, but don't override localStorage values unless needed
    const loadTheme = async () => {
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
          // Keep the localStorage values that are already set
        }
      }
      
      setIsLoaded(true);
    };

    loadTheme();
  }, [user, storageKey, colorStorageKey, defaultTheme]);

  useEffect(() => {
    // Apply theme changes immediately since we now initialize from localStorage
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
        const themeColor = colorTheme === 'sporty' ? '#FF9E1B' : 
                           colorTheme === 'minimal' ? '#333333' : '#CAB6F7';
        metaThemeColor.setAttribute('content', themeColor);
      }
      
      // Ensure body visibility is restored after theme application
      requestAnimationFrame(() => {
        document.body.classList.add('theme-loaded');
      });
    };

    updateTheme();

    const handleMediaChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, colorTheme]);

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
    colorTheme,
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