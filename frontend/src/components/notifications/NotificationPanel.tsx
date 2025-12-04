import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BookOpen, Check, CheckCheck, Clock, Package, Settings, Trash2, X } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { NotificationSettings } from './NotificationSettings';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';

export function NotificationPanel() {
  const { theme, currentTheme } = useThemeTokens();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'availability':
        return <BookOpen className="w-4 h-4" />;
      case 'hold_ready':
        return <Package className="w-4 h-4" />;
      case 'due_soon':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'availability':
        return theme === 'light' ? 'text-green-600 bg-green-50' : 'text-green-400 bg-green-500/10';
      case 'hold_ready':
        return theme === 'light' ? 'text-blue-600 bg-blue-50' : 'text-blue-400 bg-blue-500/10';
      case 'due_soon':
        return theme === 'light' ? 'text-orange-600 bg-orange-50' : 'text-orange-400 bg-orange-500/10';
      default:
        return theme === 'light' ? 'text-blue-600 bg-blue-50' : 'text-cyan-400 bg-blue-500/10';
    }
  };

  if (showSettings) {
    return <NotificationSettings onBack={() => setShowSettings(false)} />;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-slate-800'}`}
        >
          <Bell className={`w-5 h-5 ${currentTheme.text}`} />
          {unreadCount > 0 && (
            <Badge
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                theme === 'light' ? 'bg-red-600' : 'bg-red-500'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className={`${currentTheme.cardBg} w-full sm:max-w-md`}>
        <SheetHeader>
          <SheetTitle className={currentTheme.text}>
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className={`${theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-slate-800'}`}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </SheetTitle>
          <SheetDescription className={currentTheme.textMuted}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'No unread notifications'}
          </SheetDescription>
        </SheetHeader>

        {notifications.length > 0 && (
          <div className="flex gap-2 mt-4">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className={`flex-1 ${
                  theme === 'light'
                    ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                    : 'border-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className={`${
                theme === 'light'
                  ? 'border-red-200 text-red-700 hover:bg-red-50'
                  : 'border-red-700 text-red-400 hover:bg-red-900/20'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          </div>
        )}

        <Separator className={`my-4 ${currentTheme.border}`} />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className={`text-center py-12 ${currentTheme.textMuted}`}>
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No notifications yet</p>
              <p className="text-sm">We'll notify you about book availability and holds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-4 rounded-lg border transition-all ${
                    notification.isRead
                      ? `${currentTheme.border} ${
                          theme === 'light' ? 'bg-white' : 'bg-slate-800/30'
                        }`
                      : `${
                          theme === 'light'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-700 border-slate-600'
                        }`
                  }`}
                >
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className={`absolute top-2 right-2 p-1 rounded ${
                      theme === 'light'
                        ? 'hover:bg-red-100 text-red-600'
                        : 'hover:bg-red-900/30 text-red-400'
                    } transition-colors`}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex gap-3">
                    {notification.bookImageUrl && (
                      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden">
                        <ImageWithFallback
                          src={notification.bookImageUrl}
                          alt={notification.bookTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {!notification.bookImageUrl && (
                      <div
                        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`${currentTheme.text} text-sm mb-1`}>{notification.message}</p>
                      <p className={`${currentTheme.textMuted} text-xs mb-2`}>
                        {notification.bookAuthor}
                      </p>
                      <div className="flex items-center gap-2">
                        {notification.createdAt && (
                          <span className={`text-xs ${currentTheme.textMuted}`}>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className={`h-6 px-2 text-xs ${
                              theme === 'light'
                                ? 'text-blue-700 hover:bg-blue-100'
                                : 'text-cyan-400 hover:bg-slate-700'
                            }`}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
