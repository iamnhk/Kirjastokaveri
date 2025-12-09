import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useThemeTokens } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { themeClassName } from '../utils/themeClassName';

export function Signup() {
  const { theme, currentTheme } = useThemeTokens();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sharedInputClass = themeClassName(theme, {
    base: `pl-11 ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-12 rounded-xl`,
    light: 'shadow-sm',
    dark: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
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
                light: 'bg-gradient-to-br from-purple-600 to-pink-600',
                dark: 'bg-gradient-to-br from-purple-600 to-pink-600',
              })}
            >
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className={`${currentTheme.text} text-3xl mb-2`}>Create Account</h1>
          <p className={currentTheme.textMuted}>Join Kirjastokaveri and start your reading journey</p>
        </div>

        {/* Signup Form */}
        <div
          className={themeClassName(theme, {
            base: `${currentTheme.cardBg} rounded-3xl p-8 border ${currentTheme.border}`,
            light: 'shadow-xl shadow-blue-200/50',
            dark: 'shadow-2xl',
          })}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className={currentTheme.text}>Full Name</Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

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
                  className={sharedInputClass}
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
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={currentTheme.text}>Confirm Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={sharedInputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 rounded" required />
              <span className={`${currentTheme.textMuted} text-sm`}>
                I agree to the{' '}
                <a href="#" className={`${currentTheme.accentText} hover:underline`}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className={`${currentTheme.accentText} hover:underline`}>
                  Privacy Policy
                </a>
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={themeClassName(theme, {
                base: `w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} h-12 rounded-xl shadow-lg transition-all`,
                light: 'shadow-purple-300/50',
                dark: 'shadow-purple-500/30',
              })}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={currentTheme.textMuted}>
              Already have an account?{' '}
              <Link to="/login" className={`${currentTheme.accentText} hover:underline`}>
                Sign in
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
            Demo: Enter any details to create an account
          </p>
        </div>
      </div>
    </div>
  );
}
