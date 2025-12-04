import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
  }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeTokens() {
  const context = useTheme();
  return {
    ...context,
    currentTheme: themes[context.theme],
  };
}

export const themes = {
  dark: {
    bg: 'bg-slate-950',
    cardBg: 'bg-slate-900',
    cardBgHover: 'bg-slate-800',
    sectionBg: 'bg-gradient-to-b from-slate-900/50 to-slate-950',
    sectionBg2: 'bg-slate-950/80',
    heroBg: 'from-blue-950 via-slate-900 to-slate-900',
    border: 'border-slate-800/50',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'bg-purple-600 hover:bg-purple-700',
    accentText: 'text-purple-500',
    gradient: 'from-slate-900 to-slate-950',
    heroGradient: 'from-blue-950 via-slate-900 to-slate-900',
    buttonGradient: 'from-purple-600 to-purple-500',
    buttonGradientHover: 'from-purple-700 to-purple-600',
    inputBg: 'bg-slate-800/60',
    inputBorder: 'border-slate-600/40',
  },
  light: {
    bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50',
    cardBg: 'bg-white',
    cardBgHover: 'bg-purple-50',
    sectionBg: 'bg-white',
    sectionBg2: 'bg-gradient-to-b from-white to-purple-50/30',
    heroBg: 'from-purple-100 via-pink-100 to-blue-100',
    border: 'border-purple-200/60',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    accent: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    accentText: 'text-purple-600',
    gradient: 'from-white via-purple-50/30 to-pink-50/30',
    heroGradient: 'from-purple-100 via-pink-100 to-blue-100',
    buttonGradient: 'from-purple-600 to-pink-600',
    buttonGradientHover: 'from-purple-700 to-pink-700',
    inputBg: 'bg-white',
    inputBorder: 'border-purple-200',
  },
};

export type ThemeTokens = typeof themes.light;