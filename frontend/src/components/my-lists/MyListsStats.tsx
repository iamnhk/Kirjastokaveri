import { BookMarked, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';

interface MyListsStatsProps {
  readingCount: number;
  wishlistCount: number;
  reservationsCount: number;
  completedCount: number;
}

export function MyListsStats({
  readingCount,
  wishlistCount,
  reservationsCount,
  completedCount,
}: MyListsStatsProps) {
  const { theme, currentTheme } = useThemeTokens();

  const cards = [
    {
      icon: BookMarked,
      label: 'Currently Reading',
      description: 'Books in progress',
      count: readingCount,
      lightClasses: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-700',
      darkClasses: 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30 text-cyan-400',
    },
    {
      icon: Clock,
      label: 'Wishlist',
      description: 'Books to read next',
      count: wishlistCount,
      lightClasses: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-700',
      darkClasses: 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30 text-blue-400',
    },
    {
      icon: Calendar,
      label: 'Reservations',
      description: 'Books on hold',
      count: reservationsCount,
      lightClasses: 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 text-orange-700',
      darkClasses: 'bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30 text-orange-400',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      description: 'Books finished',
      count: completedCount,
      lightClasses: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 text-green-700',
      darkClasses: 'bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30 text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-12">
      {cards.map(({ icon: Icon, label, description, count, lightClasses, darkClasses }) => (
        <div
          key={label}
          className={`${theme === 'light' ? lightClasses : darkClasses} backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border`}
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <Icon className="w-6 h-6 md:w-8 md:h-8" />
            <span className={`text-2xl md:text-3xl ${currentTheme.text}`}>{count}</span>
          </div>
          <h3 className={`${currentTheme.text} text-base md:text-lg`}>{label}</h3>
          <p className={`${currentTheme.textMuted} text-xs md:text-sm`}>{description}</p>
        </div>
      ))}
    </div>
  );
}
