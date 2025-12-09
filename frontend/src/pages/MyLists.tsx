import { lazy, Suspense, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MyListsAuthenticated } from '../components/my-lists';
import { useThemeTokens } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { BookOpen, Heart, CheckCircle, LogIn } from 'lucide-react';

const AuthModalLazy = lazy(() =>
  import('../components/auth/AuthModal').then((module) => ({ default: module.AuthModal }))
);

export function MyLists() {
  const { currentTheme } = useThemeTokens();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className={`min-h-screen ${currentTheme.bg} py-6 md:py-16`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <PageHeader
              title="My Lists"
              description="Manage your reading journey"
              currentTheme={currentTheme}
            />

            {/* Unauthenticated state - prompt to sign in */}
            <div className={`${currentTheme.card} rounded-xl p-8 md:p-12 text-center`}>
              <div className="max-w-md mx-auto">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${currentTheme.accent} flex items-center justify-center`}>
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className={`text-2xl font-bold ${currentTheme.text} mb-3`}>
                  Sign in to access your lists
                </h2>
                <p className={`${currentTheme.textMuted} mb-8`}>
                  Create an account or sign in to save books, track your reading progress, and get notified when books become available.
                </p>

                {/* Features preview */}
                <div className="grid gap-4 mb-8 text-left">
                  <div className="flex items-start gap-3">
                    <Heart className={`w-5 h-5 ${currentTheme.accentText} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`font-medium ${currentTheme.text}`}>Wishlist</p>
                      <p className={`text-sm ${currentTheme.textMuted}`}>Save books you want to read later</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className={`w-5 h-5 ${currentTheme.accentText} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`font-medium ${currentTheme.text}`}>Currently Reading</p>
                      <p className={`text-sm ${currentTheme.textMuted}`}>Track books you're reading now</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 ${currentTheme.accentText} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`font-medium ${currentTheme.text}`}>Completed</p>
                      <p className={`text-sm ${currentTheme.textMuted}`}>Keep a record of books you've finished</p>
                    </div>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`inline-flex items-center gap-2 px-6 py-3 ${currentTheme.accent} text-white font-medium rounded-lg hover:opacity-90 transition-opacity`}
                >
                  <LogIn className="w-5 h-5" />
                  Sign In to Get Started
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <Suspense fallback={null}>
          <AuthModalLazy isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </Suspense>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${currentTheme.bg} py-6 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <PageHeader
            title="My Lists"
            description="Manage your reading journey"
            currentTheme={currentTheme}
          />

          <MyListsAuthenticated />
        </div>
      </div>
    </Layout>
  );
}