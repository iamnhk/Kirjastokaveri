import { CSSProperties, ReactNode } from 'react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import { ImageWithFallback } from '../common/ImageWithFallback';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400';

type BookCardShadow = 'flat' | 'raised' | 'deep';
type BookCardAspect = '2/3' | 'square' | 'video';

export interface BookCardProps {
  image?: string | null;
  title: string;
  aspect?: BookCardAspect;
  overlay?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
  shadow?: BookCardShadow;
  className?: string;
  coverClassName?: string;
}

function getAspectClass(aspect: BookCardAspect): string {
  switch (aspect) {
    case 'square':
      return 'aspect-square';
    case 'video':
      return 'aspect-video';
    default:
      return 'aspect-[2/3]';
  }
}

function getShadowClasses(theme: 'light' | 'dark', shadow: BookCardShadow, interactive: boolean) {
  if (shadow === 'flat') {
    return { light: '', dark: '', style: undefined as CSSProperties | undefined };
  }

  if (shadow === 'raised') {
    return {
      light: `shadow-lg${interactive ? ' hover:shadow-xl hover:shadow-blue-200/50' : ''}`,
      dark: 'shadow-2xl',
      style: undefined as CSSProperties | undefined,
    };
  }

  return {
    light: 'shadow-lg',
    dark: 'shadow-2xl',
    style: {
      boxShadow:
        theme === 'light'
          ? '0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2)'
          : '0 10px 30px rgba(15, 23, 42, 0.45)',
    } as CSSProperties,
  };
}

export function BookCard({
  image,
  title,
  aspect = '2/3',
  overlay,
  children,
  footer,
  onClick,
  interactive = true,
  shadow = 'raised',
  className = '',
  coverClassName = '',
}: BookCardProps) {
  const { theme } = useThemeTokens();
  const aspectClass = getAspectClass(aspect);
  const { light, dark, style } = getShadowClasses(theme, shadow, interactive);

  const outerClass = [
    'group',
    interactive ? 'cursor-pointer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const coverBaseClass = [
    'relative',
    'w-full',
    aspectClass,
    'overflow-hidden',
    'rounded-xl',
    interactive ? 'transition-transform duration-300 group-hover:scale-105' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const coverClass = themeClassName(theme, {
    base: `${coverBaseClass} ${coverClassName}`.trim(),
    light,
    dark,
  });

  return (
    <div className={outerClass} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={coverClass} style={style}>
        <ImageWithFallback
          src={image || FALLBACK_IMAGE}
          alt={title}
          className="w-full h-full object-cover"
        />
        {overlay}
      </div>

      {children ? <div className="mt-3 space-y-2 text-left">{children}</div> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
