import { Suspense, lazy, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Palette, LogOut } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { Footer } from './Footer';
import { themeClassName } from '../../utils/themeClassName';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

const AuthModalLazy = lazy(() =>
  import('../auth/AuthModal').then((module) => ({ default: module.AuthModal }))
);

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Browse', path: '/browse' },
  { label: 'My Lists', path: '/my-lists' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, currentTheme } = useThemeTokens();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const containerClass = themeClassName(theme, {
    base: `max-w-[1400px] mx-auto bg-gradient-to-b ${currentTheme.gradient} md:rounded-t-3xl overflow-hidden md:border-t md:border-x ${currentTheme.border}`,
    light: 'md:shadow-xl md:shadow-blue-200/50',
    dark: 'md:shadow-2xl',
  });

  const themeToggleClass = themeClassName(theme, {
    base: 'transition-colors',
    light: 'bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-50',
    dark: `${currentTheme.cardBg}/60 ${currentTheme.border} ${currentTheme.text} hover:${currentTheme.cardBg}`,
  });

  const signInButtonClass = themeClassName(theme, {
    base: `bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} shadow-lg`,
    light: 'shadow-blue-300/50',
    dark: 'shadow-blue-500/30',
  });

  const avatarRingClass = themeClassName(theme, {
    base: 'w-9 h-9 ring-2 cursor-pointer',
    light: 'ring-blue-300/50',
    dark: 'ring-white/20',
  });

  const avatarFallbackClass = themeClassName(theme, {
    base: '',
    light: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    dark: 'bg-blue-600',
  });

  const navHighlightClass = themeClassName(theme, {
    base: 'absolute -bottom-6 left-0 right-0 h-0.5',
    light: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    dark: 'bg-blue-500',
  });

  return (
    <>
      {/* Mobile Header - Only on mobile */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <div className={`min-h-screen ${currentTheme.bg} md:pt-8 md:px-8 pb-20 md:pb-0`}>
        <div className={containerClass}>
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className={`hidden md:flex relative z-10 items-center justify-between px-12 py-6 ${currentTheme.cardBg}/80 backdrop-blur-md border-b ${currentTheme.border}`}>
            <Link to="/" className="flex items-center gap-3 group">
              <BookOpen
                className={themeClassName(theme, {
                  base: 'w-7 h-7',
                  light: 'text-blue-600',
                  dark: currentTheme.text,
                })}
              />
              <span className={`${currentTheme.text} text-xl`}>Kirjastokaveri</span>
            </Link>
            <div className="flex items-center gap-8">
              {NAV_LINKS.map(({ label, path }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`transition-colors relative ${
                      active ? currentTheme.text : `${currentTheme.textMuted} hover:${currentTheme.text}`
                    }`}
                  >
                    {label}
                    {active && (
                      <span className={navHighlightClass} />
                    )}
                  </Link>
                );
              })}
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                {isAuthenticated && <NotificationPanel />}
                
                {/* Theme Changer */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className={themeToggleClass}
                    >
                      <Palette className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={`${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.text}`}>
                    <DropdownMenuItem 
                      onClick={() => setTheme('dark')}
                      className="cursor-pointer hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-900"></div>
                        <span>Dark</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme('light')}
                      className="cursor-pointer hover:bg-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-400"></div>
                        <span>Light</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* User Menu or Sign In Button */}
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className={avatarRingClass}>
                        <AvatarFallback className={avatarFallbackClass}>
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={`${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.text}`} align="end">
                      <div className="px-2 py-1.5">
                        <p className={`${currentTheme.text} text-sm`}>{user?.name}</p>
                        <p className={`${currentTheme.textMuted} text-xs`}>{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator className={currentTheme.border} />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="cursor-pointer hover:bg-slate-800 text-red-400"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={() => setShowAuthModal(true)}
                    className={signInButtonClass}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main>
            {children}
          </main>

          {/* Footer - Inside container on desktop */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>

        {/* Auth Modal */}
        <Suspense fallback={null}>
          <AuthModalLazy isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </Suspense>
      </div>

      {/* Mobile Bottom Navigation - Only on mobile */}
      <MobileNav />
    </>
  );
}
