/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tea-theme';
const DEFAULT_THEME = 'tea-light';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {}
});

const applyThemeToDocument = (themeName) => {
  const root = document.documentElement;
  if (!root) return;
  root.setAttribute('data-theme', themeName);
  root.style.colorScheme = themeName === 'tea-light' ? 'light' : 'dark';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      applyThemeToDocument(stored);
      return stored;
    }
    // Always default to dark theme (tea-dark) instead of checking system preference
    applyThemeToDocument(DEFAULT_THEME);
    return DEFAULT_THEME;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyThemeToDocument(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event) => {
      // Keep current theme even if system preference changes
      // Only use DEFAULT_THEME if no stored preference exists
      setThemeState((current) => {
        if (localStorage.getItem(STORAGE_KEY)) return current;
        return DEFAULT_THEME; // Always default to tea-dark
      });
    };
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, []);

  const setTheme = (value) => {
    setThemeState(value);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'tea-dark' ? 'tea-light' : 'tea-dark'));
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
