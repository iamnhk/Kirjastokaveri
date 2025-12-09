import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookMarked } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Badge } from '../ui/badge';

export function MobileNav() {
  const { theme, currentTheme } = useThemeTokens();
  const location = useLocation();
  const { notifications } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/browse', icon: Search, label: 'Browse' },
    { path: '/my-lists', icon: BookMarked, label: 'Lists' },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t ${currentTheme.border} ${
        theme === 'light' ? 'bg-white/95' : 'bg-slate-900/95'
      } backdrop-blur-lg`}
    >
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active
                  ? theme === 'light'
                    ? 'text-purple-600'
                    : 'text-purple-400'
                  : currentTheme.textMuted
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
                {item.path === '/my-lists' && unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
              <span className={`text-xs ${active ? 'font-medium' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
