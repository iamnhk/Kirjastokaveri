import type { Theme } from '../contexts/ThemeContext';

interface ThemeClassOptions {
  light: string;
  dark: string;
  base?: string;
}

export function themeClassName(theme: Theme, { light, dark, base }: ThemeClassOptions): string {
  const themed = theme === 'light' ? light : dark;
  return base ? `${base} ${themed}`.trim() : themed;
}
