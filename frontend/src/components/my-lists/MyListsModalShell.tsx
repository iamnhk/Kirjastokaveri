import type { ReactNode } from 'react';
import { useThemeTokens } from '../../contexts/ThemeContext';

interface MyListsModalShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  footerClassName?: string;
}

export function MyListsModalShell({
  title,
  subtitle,
  children,
  footer,
  footerClassName,
}: MyListsModalShellProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${currentTheme.cardBg} rounded-2xl p-6 md:p-8 max-w-md w-full border ${currentTheme.border} ${
          theme === 'light' ? 'shadow-2xl shadow-blue-200/50' : 'shadow-2xl'
        }`}
      >
        <h3 className={`${currentTheme.text} text-xl md:text-2xl mb-4`}>{title}</h3>
        {subtitle && <p className={`${currentTheme.textMuted} text-sm mb-6`}>{subtitle}</p>}
        {children}
        <div className={footerClassName ?? 'flex gap-3'}>{footer}</div>
      </div>
    </div>
  );
}