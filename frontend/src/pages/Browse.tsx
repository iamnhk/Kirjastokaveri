import { Suspense, lazy, useMemo } from 'react';
import { Layout } from '../components/layout/Layout';
import { BrowseControls } from '../components/browse/BrowseControls';
import {
  BrowseErrorAlert,
  BrowseEmptyState,
  BrowseLoadingState,
  BrowseResultsSection,
  BrowseFilteredEmptyState,
  BrowseNoSearchResults,
} from '../components/browse';
import { useBrowseController } from '../components/browse/useBrowseController';
import { useThemeTokens } from '../contexts/ThemeContext';
import { themeClassName } from '../utils/themeClassName';

const AuthModalLazy = lazy(() =>
  import('../components/auth/AuthModal').then((module) => ({ default: module.AuthModal }))
);

const BookDetailModalLazy = lazy(() =>
  import('../components/book/BookDetailModal').then((module) => ({ default: module.BookDetailModal })),
);

const LibrarySelectionModalLazy = lazy(() =>
  import('../components/book/LibrarySelectionModal').then((module) => ({ default: module.LibrarySelectionModal }))
);

export function Browse() {
  const { theme, currentTheme } = useThemeTokens();
  const { filters, search, wishlist, modals, location, view } = useBrowseController();
  const { auth, detail, librarySelection } = modals;

  const browsePageClass = useMemo(
    () =>
      themeClassName(theme, {
        light: 'bg-[radial-gradient(circle_at_top,_rgba(123,97,255,0.12),_rgba(0,0,0,0))] text-slate-900',
        dark: 'bg-slate-950 text-slate-100',
      }),
    [theme]
  );

  return (
    <Layout>
      <div className={`min-h-screen pb-24 ${browsePageClass}`}>
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 md:px-6 lg:px-8">
          <div className="relative z-10 space-y-12">
            <BrowseControls
              inputValue={search.inputValue}
              onInputChange={search.setInput}
              onSearch={search.submit}
              isLoading={search.isLoading}
              genres={filters.genres}
              selectedGenre={filters.selectedGenre}
              onSelectGenre={filters.selectGenre}
              availabilityOptions={filters.availabilityOptions}
              selectedAvailability={filters.selectedAvailability}
              onSelectAvailability={filters.selectAvailability}
              isLoadingLocation={location.isLoading}
              requestLocation={location.request}
              locationPermissionGranted={location.permissionGranted}
              isUsingFallbackLocation={location.isUsingFallbackLocation}
              userLocation={location.userLocation}
            />

            <BrowseErrorAlert theme={theme} message={search.error} />
            <BrowseEmptyState theme={theme} currentTheme={currentTheme} visible={search.showEmptyState} />
            <BrowseLoadingState currentTheme={currentTheme} visible={search.isLoading} />

            {view.showResults && (
              <BrowseResultsSection
                currentTheme={currentTheme}
                filteredBooks={search.filteredBooks}
                displayBooks={search.displayBooks}
                searchQuery={search.query}
                getClosestAvailableLocation={location.getClosestAvailableLocation}
                isInWishlist={wishlist.isInWishlist}
                onSelectBook={modals.detail.setBook}
                onAddToWishlist={wishlist.add}
              />
            )}

            <BrowseFilteredEmptyState theme={theme} currentTheme={currentTheme} show={view.showFilteredEmpty} />
            <BrowseNoSearchResults currentTheme={currentTheme} show={view.showNoSearchResults} />
          </div>
        </div>

        <BrowseBackdrop />
      </div>

      <Suspense fallback={null}>
        <AuthModalLazy isOpen={auth.isOpen} onClose={auth.close} />
      </Suspense>

      <Suspense fallback={null}>
        {detail.isOpen && detail.book && (
          <BookDetailModalLazy
            book={detail.book}
            isOpen={detail.isOpen}
            onClose={() => detail.setBook(null)}
            onAddToList={wishlist.add}
            onTrackLibraries={(book, selectedLibraries) => {
              wishlist.trackLibraries(book, selectedLibraries);
              detail.setBook(null); // Close the detail modal after tracking
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {librarySelection.isOpen && librarySelection.book && (
          <LibrarySelectionModalLazy
            book={librarySelection.book}
            isOpen={librarySelection.isOpen}
            onClose={() => librarySelection.setBook(null)}
            onLibrarySelection={wishlist.trackLibraries}
          />
        )}
      </Suspense>
    </Layout>
  );
}

export default Browse;

function BrowseBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-40 h-[580px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(123,97,255,0.18)_0%,_rgba(123,97,255,0)_70%)] blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[360px] w-[360px] -translate-x-1/3 translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(66,226,196,0.12)_0%,_rgba(66,226,196,0)_70%)] blur-3xl" />
      <div className="absolute bottom-12 right-0 h-[420px] w-[420px] translate-x-1/3 rounded-full bg-[radial-gradient(circle,_rgba(123,97,255,0.12)_0%,_rgba(123,97,255,0)_70%)] blur-3xl" />
    </div>
  );
}
