import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useThemeTokens } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { themeClassName } from '../utils/themeClassName';

export function Login() {
  const { theme, currentTheme } = useThemeTokens();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center p-8`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className={themeClassName(theme, {
                  base: 'p-3 rounded-2xl',
                  light: 'bg-gradient-to-br from-blue-600 to-cyan-600',
                  dark: 'bg-gradient-to-br from-blue-500 to-blue-500',
                })}
              >
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className={`${currentTheme.text} text-3xl mb-2`}>Welcome Back</h1>
          <p className={currentTheme.textMuted}>Sign in to access your book collection</p>
        </div>

        {/* Login Form */}
        <div
          className={themeClassName(theme, {
            base: `${currentTheme.cardBg} rounded-3xl p-8 border ${currentTheme.border}`,
            light: 'shadow-xl shadow-blue-200/50',
            dark: 'shadow-2xl',
          })}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className={currentTheme.text}>Email</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={themeClassName(theme, {
                    base: `pl-11 ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-12 rounded-xl`,
                    light: 'shadow-sm',
                    dark: '',
                  })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={currentTheme.text}>Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={themeClassName(theme, {
                    base: `pl-11 ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-12 rounded-xl`,
                    light: 'shadow-sm',
                    dark: '',
                  })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className={`${currentTheme.textMuted} text-sm`}>Remember me</span>
              </label>
              <a href="#" className={`${currentTheme.accentText} text-sm hover:underline`}>
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={themeClassName(theme, {
                base: `w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} h-12 rounded-xl shadow-lg transition-all`,
                light: 'shadow-blue-300/50',
                dark: 'shadow-blue-500/30',
              })}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={currentTheme.textMuted}>
              Don't have an account?{' '}
              <Link to="/signup" className={`${currentTheme.accentText} hover:underline`}>
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Note */}
        <div
          className={themeClassName(theme, {
            base: 'mt-6 p-4 rounded-2xl text-center',
            light: 'bg-blue-50 border border-blue-200',
            dark: 'bg-slate-800/50 border border-slate-700/50',
          })}
        >
          <p className={`${currentTheme.textMuted} text-sm`}>
            Demo: Use any email and password to login
          </p>
        </div>
      </div>
    </div>
  );
}
