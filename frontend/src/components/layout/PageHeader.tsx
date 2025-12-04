import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

type ThemeDefinition = Record<string, string>;

interface PageHeaderProps {
  title: string;
  description?: string;
  currentTheme: ThemeDefinition;
  align?: 'left' | 'center';
  className?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  currentTheme,
  align = 'left',
  className,
  actions,
}: PageHeaderProps) {
  const alignmentClass = align === 'center' ? 'text-center' : '';
  const actionsWrapperClass = align === 'center' ? 'md:justify-center' : 'md:justify-end';

  return (
    <div className={cn('mb-6 md:mb-12', className, alignmentClass)}>
      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-center',
          align === 'center' ? 'md:flex-col' : 'md:justify-between'
        )}
      >
        <div className={cn('flex-1', align === 'center' ? 'md:w-full' : '')}>
          <h1 className={`${currentTheme.text} text-2xl md:text-4xl mb-2 md:mb-3`}>{title}</h1>
          {description && <p className={`${currentTheme.textMuted} text-sm md:text-base`}>{description}</p>}
        </div>
        {actions && (
          <div className={cn('flex w-full md:w-auto', actionsWrapperClass)}>
            <div className={cn('w-full md:w-auto', align === 'center' ? 'md:max-w-md' : '')}>{actions}</div>
          </div>
        )}
      </div>
    </div>
  );
}
