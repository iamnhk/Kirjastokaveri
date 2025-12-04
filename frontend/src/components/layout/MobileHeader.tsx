import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bell, Menu, Palette, User, LogOut } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { NotificationPanel } from '../notifications/NotificationPanel';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';

const AuthModalLazy = lazy(() =>
  import('../auth/AuthModal').then((module) => ({ default: module.AuthModal }))
);

export function MobileHeader() {
  const { theme, setTheme, currentTheme } = useThemeTokens();
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications } = useNotifications();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-40 md:hidden border-b ${currentTheme.border} ${
        theme === 'light' ? 'bg-white/95' : 'bg-slate-900/95'
      } backdrop-blur-lg`}
    >
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BookOpen className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600' : 'text-cyan-400'}`} />
          <span className={`${currentTheme.text} font-medium`}>Kirjastokaveri</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Show notifications and user menu only when authenticated */}
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className={`w-5 h-5 ${currentTheme.text}`} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={`w-full ${currentTheme.cardBg} ${currentTheme.border}`}>
                  <SheetHeader>
                    <SheetTitle className={currentTheme.text}>Notifications</SheetTitle>
                    <SheetDescription className="sr-only">
                      View and manage your notifications
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4">
                    <NotificationPanel />
                  </div>
                </SheetContent>
              </Sheet>

              {/* User Avatar & Menu */}
              <Sheet open={showMenu} onOpenChange={setShowMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`${
                          theme === 'light'
                            ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
                            : 'bg-gradient-to-br from-blue-700 to-cyan-700'
                        } text-white text-sm`}
                      >
                        {user?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={`w-[280px] ${currentTheme.cardBg} ${currentTheme.border}`}>
                  <SheetHeader>
                    <SheetTitle className={currentTheme.text}>Account</SheetTitle>
                    <SheetDescription className="sr-only">
                      Manage your account settings, theme preferences, and sign out
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* User Profile */}
                    <div
                      className={`flex items-center gap-3 p-4 rounded-lg ${
                        theme === 'light' ? 'bg-blue-50' : 'bg-slate-800/50'
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback
                          className={`${
                            theme === 'light'
                              ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
                              : 'bg-gradient-to-br from-blue-700 to-cyan-700'
                          } text-white`}
                        >
                          {user?.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`${currentTheme.text} font-medium truncate`}>{user?.name}</p>
                        <p className={`${currentTheme.textMuted} text-sm truncate`}>{user?.email}</p>
                      </div>
                    </div>

                    {/* Theme Toggle */}
                    <div className="space-y-2">
                      <p className={`${currentTheme.textMuted} text-sm px-4`}>Theme</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          onClick={() => setTheme('light')}
                          className={`justify-start ${
                            theme === 'light' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : ''
                          }`}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          onClick={() => setTheme('dark')}
                          className={`justify-start ${
                            theme === 'dark' ? 'bg-blue-600' : ''
                          }`}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Dark
                        </Button>
                      </div>
                    </div>

                    {/* Sign Out */}
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              {/* Theme Toggle for non-authenticated users */}
              <Sheet open={showMenu} onOpenChange={setShowMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className={`w-6 h-6 ${currentTheme.text}`} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={`w-[280px] ${currentTheme.cardBg} ${currentTheme.border}`}>
                  <SheetHeader>
                    <SheetTitle className={currentTheme.text}>Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                      Access theme settings and sign in to your account
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Theme Toggle */}
                    <div className="space-y-2">
                      <p className={`${currentTheme.textMuted} text-sm px-4`}>Theme</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          onClick={() => setTheme('light')}
                          className={`justify-start ${
                            theme === 'light' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : ''
                          }`}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          onClick={() => setTheme('dark')}
                          className={`justify-start ${
                            theme === 'dark' ? 'bg-blue-600' : ''
                          }`}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Dark
                        </Button>
                      </div>
                    </div>

                    {/* Sign In Button */}
                    <Button
                      onClick={() => {
                        setShowMenu(false);
                        setShowAuthModal(true);
                      }}
                      className={`w-full ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModalLazy isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </Suspense>
    </header>
  );
}
