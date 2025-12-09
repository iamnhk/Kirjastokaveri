import { useState } from 'react';
import { BookOpen, Mail, Lock, User, Loader2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { themeClassName } from '../../utils/themeClassName';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { theme, currentTheme } = useThemeTokens();
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const sharedInputClass = themeClassName(theme, {
    base: `pl-11 ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-11 rounded-lg`,
    light: 'shadow-sm',
    dark: '',
  });

  const authButtonClass = themeClassName(theme, {
    base: `w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} h-11 rounded-lg shadow-lg transition-all`,
    light: 'shadow-purple-300/50',
    dark: 'shadow-purple-500/30',
  });

  const tabWrapperClass = themeClassName(theme, {
    base: 'flex gap-2 p-1 rounded-lg',
    light: 'bg-white/50',
    dark: 'bg-slate-900/50',
  });

  const activeTabClass = themeClassName(theme, {
    base: 'bg-gradient-to-r text-white shadow-lg',
    light: 'from-purple-600 to-pink-600',
    dark: 'from-purple-600 to-pink-600',
  });

  const headerGradientClass = themeClassName(theme, {
    base: 'p-6 border-b',
    light: 'bg-gradient-to-r from-purple-50 to-pink-50',
    dark: 'bg-gradient-to-r from-slate-800 to-slate-900',
  });

  const logoBadgeClass = themeClassName(theme, {
    base: 'p-2 rounded-xl',
    light: 'bg-gradient-to-br from-purple-600 to-pink-600',
    dark: 'bg-gradient-to-br from-purple-600 to-pink-600',
  });

  const demoNoteClass = themeClassName(theme, {
    base: 'text-center p-3 rounded-lg',
    light: 'bg-purple-50',
    dark: 'bg-slate-800/50',
  });

  const tabButtonClass = (isActive: boolean) =>
    isActive ? activeTabClass : `${currentTheme.textMuted} hover:${currentTheme.text}`;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
      setLoginEmail('');
      setLoginPassword('');
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!signupName || !signupEmail || !signupPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signup(signupName, signupEmail, signupPassword);
      onClose();
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${currentTheme.cardBg} ${currentTheme.border} max-w-md p-0 overflow-hidden`}>
        <div className={`${headerGradientClass} ${currentTheme.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={logoBadgeClass}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className={`${currentTheme.text} text-xl`}>
                {activeTab === 'login' ? 'Welcome Back' : 'Join Kirjastokaveri'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {activeTab === 'login'
                  ? 'Sign in to your account to access your reading lists and personalized features'
                  : 'Create a new account to start building your reading lists'}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-1 transition-colors ${currentTheme.border} ${currentTheme.hover}`}
            >
              <span className="sr-only">Close</span>
              <X className={`h-4 w-4 ${currentTheme.textMuted}`} />
            </button>
          </div>

          <div className={tabWrapperClass}>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${tabButtonClass(activeTab === 'login')}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${tabButtonClass(activeTab === 'signup')}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className={currentTheme.text}>
                Email
              </Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className={currentTheme.text}>
                Password
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className={currentTheme.textMuted}>Remember me</span>
              </label>
              <a href="#" className={`${currentTheme.accentText} hover:underline`}>
                Forgot password?
              </a>
            </div>

            <Button type="submit" disabled={isLoading} className={authButtonClass}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className={demoNoteClass}>
              <p className={`${currentTheme.textMuted} text-xs`}>
                Demo: Use any email and password to login
              </p>
            </div>
          </form>
        )}

        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className={currentTheme.text}>
                Full Name
              </Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className={currentTheme.text}>
                Email
              </Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className={currentTheme.text}>
                Password
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className={currentTheme.text}>
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className={authButtonClass}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className={demoNoteClass}>
              <p className={`${currentTheme.textMuted} text-xs`}>
                Demo: Enter any details to create an account
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
