
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'soft-sandstone' | 'joyful' | 'winter-clarity' | 'centered';

export const themes = {
  'soft-sandstone': {
    name: 'Soft Sandstone',
    description: 'Warm and comfortable',
    colors: {
      background: '#FAF7F4',
      buttons: '#D2C1B0',
      accent: '#847A6D',
      borders: '#E6DED3',
      text: '#3C372F'
    }
  },
  'joyful': {
    name: 'Joyful',
    description: 'Playful and bright',
    colors: {
      background: '#FFF7F9',
      buttons: '#F9A8D4',
      accent: '#8B5CF6',
      borders: '#FDECEF',
      text: '#5A3E67',
      secondary: '#FDCFE4'
    }
  },
  'winter-clarity': {
    name: 'Winter Clarity',
    description: 'Clean and cool',
    colors: {
      background: '#F5FAFD',
      buttons: '#A0C4FF',
      accent: '#1E3A8A',
      borders: '#DCEAF5',
      text: '#263849'
    }
  },
  'centered': {
    name: 'Centered',
    description: 'Muted and grounding',
    colors: {
      background: '#F7F5F9',
      buttons: '#D8C7E8',
      accent: '#7D6CAB',
      borders: '#ECE4F3',
      text: '#4B425B',
      subtle: '#E9E3EE'
    }
  }
} as const;

interface ThemeContextType {
  currentTheme: ThemeName;
  isDarkMode: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeName) || 'soft-sandstone';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', currentTheme);
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const applyTheme = (theme: ThemeName) => {
    const themeColors = themes[theme].colors;
    const root = document.documentElement;
    
    // Apply theme-specific CSS custom properties
    root.style.setProperty('--theme-background', themeColors.background);
    root.style.setProperty('--theme-buttons', themeColors.buttons);
    root.style.setProperty('--theme-accent', themeColors.accent);
    root.style.setProperty('--theme-borders', themeColors.borders);
    root.style.setProperty('--theme-text', themeColors.text);
    
    if ('secondary' in themeColors) {
      root.style.setProperty('--theme-secondary', themeColors.secondary);
    }
    if ('subtle' in themeColors) {
      root.style.setProperty('--theme-subtle', themeColors.subtle);
    }

    // Update body background color immediately
    document.body.style.backgroundColor = themeColors.background;
    document.body.style.color = themeColors.text;

    // Add theme class to body for more specific targeting
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
    
    // Force a repaint to ensure all elements update
    document.body.style.display = 'none';
    document.body.offsetHeight; // trigger reflow
    document.body.style.display = '';
  };

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, isDarkMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
