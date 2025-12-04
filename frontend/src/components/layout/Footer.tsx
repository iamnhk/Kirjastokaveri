import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';

export function Footer() {
  const { theme, currentTheme } = useThemeTokens();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    alert(`Thank you for subscribing with ${email}!`);
    setEmail('');
  };

  const gradientAccent =
    theme === 'light'
      ? 'linear-gradient(to right, rgb(147, 51, 234), rgb(219, 39, 119), rgb(59, 130, 246))'
      : 'linear-gradient(to right, rgb(139, 92, 246), rgb(59, 130, 246), rgb(139, 92, 246))';

  const topBorderGradient =
    theme === 'light'
      ? 'linear-gradient(to right, transparent, rgb(147, 51, 234), rgb(219, 39, 119), rgb(59, 130, 246), transparent)'
      : 'linear-gradient(to right, transparent, rgb(139, 92, 246), rgb(59, 130, 246), rgb(139, 92, 246), transparent)';

  return (
    <footer
      className={`relative ${
        theme === 'light'
          ? 'bg-gradient-to-b from-blue-50/30 via-white to-blue-100/50'
          : 'bg-gradient-to-b from-slate-900/50 via-slate-800 to-slate-900'
      } border-t ${currentTheme.border}`}
    >
      <div className="h-px w-full" style={{ background: topBorderGradient }} />

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity"
            >
              <div
                className={`p-2.5 rounded-xl ${
                  theme === 'light'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-gradient-to-br from-blue-600 to-blue-600'
                } shadow-lg group-hover:shadow-xl transition-shadow`}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className={`${currentTheme.text} text-xl font-semibold`}>
                Kirjastokaveri
              </span>
            </Link>
            <p className={`${currentTheme.textMuted} text-sm mb-4 leading-relaxed`}>
              Your intelligent library companion. Discover books available right now at nearby Finnish
              libraries with real-time availability.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
                { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
                { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`p-2.5 rounded-lg ${
                    theme === 'light'
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-110'
                      : 'bg-slate-700/50 text-cyan-400 hover:bg-slate-600'
                  } transition-all duration-200`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`${currentTheme.text} font-semibold mb-4`}>Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'Browse Books', to: '/browse' },
                { label: 'My Lists', to: '/my-lists' },
                { label: 'Features', to: '/' },
                { label: 'How It Works', to: '/' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className={`${currentTheme.textMuted} hover:${currentTheme.accentText} transition-colors text-sm`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={`${currentTheme.text} font-semibold mb-4`}>Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://finna.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${currentTheme.textMuted} hover:${currentTheme.accentText} transition-colors text-sm`}
                >
                  Finna.fi
                </a>
              </li>
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Help Center'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className={`${currentTheme.textMuted} hover:${currentTheme.accentText} transition-colors text-sm cursor-pointer`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={`${currentTheme.text} font-semibold mb-4`}>Stay Updated</h3>
            <p className={`${currentTheme.textMuted} text-sm mb-4`}>
              Get notified about new features and book recommendations.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
                required
                className={`w-full px-4 py-2.5 rounded-lg ${
                  theme === 'light'
                    ? 'bg-white border-blue-200 text-gray-900'
                    : 'bg-slate-700 border-slate-600 text-white'
                } border focus:outline-none focus:ring-2 ${
                  theme === 'light' ? 'focus:ring-blue-500' : 'focus:ring-cyan-400'
                } text-sm`}
              />
              <Button
                type="submit"
                className={`w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} shadow-md hover:shadow-lg ${
                  theme === 'light' ? 'shadow-blue-300/50' : 'shadow-blue-500/30'
                } transition-all duration-200`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className={`border-t ${currentTheme.border} my-8`} />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4">
          <p
            className={`${currentTheme.textMuted} text-sm text-center md:text-left flex items-center gap-1`}
          >
            © {new Date().getFullYear()} Kirjastokaveri. Made with
            <Heart className="w-4 h-4 inline text-red-500 fill-red-500 animate-pulse" /> for book lovers in Finland.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a
                key={item}
                href="#"
                onClick={(event) => event.preventDefault()}
                className={`${currentTheme.textMuted} hover:${currentTheme.accentText} transition-colors text-sm cursor-pointer hover:underline`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="h-1.5" style={{ background: gradientAccent }} />
    </footer>
  );
}
