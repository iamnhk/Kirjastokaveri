import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

// eslint-disable-next-line react-refresh/only-export-components
export const themes = {
  dark: {
    bg: 'bg-slate-950',
    cardBg: 'bg-slate-900/80',
    cardBgHover: 'bg-slate-800/70',
    sectionBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
    sectionBg2: 'bg-slate-900/70',
    heroBg: 'from-slate-950 via-slate-900 to-slate-900',
    border: 'border-slate-800/60',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400',
    accentText: 'text-sky-400',
    gradient: 'from-slate-900 to-slate-950',
    heroGradient: 'from-slate-950 via-slate-900 to-slate-900',
    buttonGradient: 'from-sky-500 to-cyan-500',
    buttonGradientHover: 'from-sky-400 to-cyan-400',
    inputBg: 'bg-slate-900/60',
    inputBorder: 'border-slate-700/60',
  },
  light: {
    bg: 'bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50',
    cardBg: 'bg-white',
    cardBgHover: 'bg-sky-50',
    sectionBg: 'bg-white',
    sectionBg2: 'bg-gradient-to-b from-white to-sky-50/50',
    heroBg: 'from-sky-100 via-slate-100 to-emerald-100',
    border: 'border-slate-200/60',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    accent: 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600',
    accentText: 'text-sky-600',
    gradient: 'from-white via-sky-50/50 to-emerald-50/50',
    heroGradient: 'from-sky-100 via-slate-100 to-emerald-100',
    buttonGradient: 'from-sky-500 to-emerald-500',
    buttonGradientHover: 'from-sky-600 to-emerald-600',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
  },
} as const

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  themeTokens: (typeof themes)[Theme]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem('theme')
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [hasExplicitPreference, setHasExplicitPreference] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const storedTheme = window.localStorage.getItem('theme')
    return storedTheme === 'light' || storedTheme === 'dark'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme

    if (hasExplicitPreference) {
      window.localStorage.setItem('theme', theme)
    } else {
      window.localStorage.removeItem('theme')
    }
  }, [theme, hasExplicitPreference])

  useEffect(() => {
    if (typeof window === 'undefined' || hasExplicitPreference) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [hasExplicitPreference])

  const updateTheme = useCallback((value: Theme) => {
    setThemeState(value)
    setHasExplicitPreference(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setHasExplicitPreference(true)
    setThemeState(current => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const themeTokens = useMemo(() => themes[theme], [theme])

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: updateTheme,
    toggleTheme,
    themeTokens,
  }), [theme, updateTheme, toggleTheme, themeTokens])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

