import { Suspense, lazy } from 'react';
import { Layout } from '../components/layout/Layout';
import { useThemeTokens } from '../contexts/ThemeContext';
import {
  HomeHeroSection,
  HomeFeaturesSection,
  HomePopularSection,
} from '../components/home';
import { useHomeController } from '../components/home/useHomeController';

const AuthModalLazy = lazy(() =>
  import('../components/auth/AuthModal').then((module) => ({ default: module.AuthModal }))
);

const BookDetailModalLazy = lazy(() =>
  import('../components/book/BookDetailModal').then((module) => ({ default: module.BookDetailModal })),
);

export function Home() {
  const { theme, currentTheme } = useThemeTokens();
  const { hero, features, popular, modals, wishlist } = useHomeController();

  return (
    <Layout>
      <HomeHeroSection
        theme={theme}
        currentTheme={currentTheme}
        {...hero}
      />

      <HomeFeaturesSection theme={theme} currentTheme={currentTheme} features={features} />

      <HomePopularSection
        theme={theme}
        currentTheme={currentTheme}
        {...popular}
      />

      <Suspense fallback={null}>
        <AuthModalLazy isOpen={modals.auth.isOpen} onClose={modals.auth.close} />
      </Suspense>

      <Suspense fallback={null}>
        {modals.detail.isOpen && modals.detail.book && (
          <BookDetailModalLazy
            book={modals.detail.book}
            isOpen={modals.detail.isOpen}
            onClose={modals.detail.close}
            onAddToList={wishlist.add}
            onTrackLibraries={(book, selectedLibraries) => {
              wishlist.trackLibraries(book, selectedLibraries);
            }}
          />
        )}
      </Suspense>
    </Layout>
  );
}