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
        light: currentTheme.sectionBg,
        dark: currentTheme.sectionBg,
      }),
    [theme, currentTheme.sectionBg]
  );

  const headingClass = useMemo(
    () =>
      themeClassName(theme, {
        base: 'text-2xl md:text-4xl mb-2 md:mb-4',
        light: currentTheme.text,
        dark: currentTheme.text,
      }),
    [theme, currentTheme.text]
  );

  const subtitleClass = useMemo(
    () =>
      themeClassName(theme, {
        base: 'text-sm md:text-base',
        light: currentTheme.textMuted,
        dark: currentTheme.textMuted,
      }),
    [theme, currentTheme.textMuted]
  );

  return (
    <Layout>
      <div className={`px-4 md:px-12 py-6 md:py-12 ${browsePageClass}`}>
        {/* Header */}
        <div className="mb-6 md:mb-12">
          <h1 className={headingClass}>Browse Books</h1>
          <p className={subtitleClass}>Search and explore books from Finnish libraries</p>
        </div>

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
              detail.setBook(null);
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
