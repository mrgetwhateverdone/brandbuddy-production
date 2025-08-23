/**
 * This part of the code provides focused theme state management
 * Handles dark mode, color schemes, and design system integration
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { colors, spacing, typography } from '@/lib/design-system/tokens';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultColorScheme?: ColorScheme;
}

// This part of the code provides theme management with system preference detection
export function ThemeProvider({ 
  children, 
  defaultMode = 'system',
  defaultColorScheme = 'blue'
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || defaultMode;
    }
    return defaultMode;
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('color-scheme') as ColorScheme) || defaultColorScheme;
    }
    return defaultColorScheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // This part of the code handles system theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolvedTheme = () => {
      if (mode === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(mode);
      }
    };

    updateResolvedTheme();
    
    if (mode === 'system') {
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [mode]);

  // This part of the code persists theme preferences
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('color-scheme', colorScheme);
  }, [colorScheme]);

  // This part of the code applies theme classes to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-color-scheme', colorScheme);
  }, [resolvedTheme, colorScheme]);

  const contextValue: ThemeContextType = {
    mode,
    colorScheme,
    resolvedTheme,
    setMode,
    setColorScheme,
    colors,
    spacing,
    typography,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// This part of the code provides typed hook for theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
