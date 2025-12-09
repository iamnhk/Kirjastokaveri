import { BookOpen, Loader2 } from 'lucide-react';
import { BookResultCard } from '../book/BookResultCard';
import { themeClassName } from '../../utils/themeClassName';
import type { Theme, ThemeTokens } from '../../contexts/ThemeContext';
import type { FinnaBook, BuildingInfo } from '../../services/finnaApi';

interface BrowseErrorAlertProps {
  theme: Theme;
  message: string | null;
}

export function BrowseErrorAlert({ theme, message }: BrowseErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={themeClassName(theme, {
        base: 'mb-6 p-4 rounded-xl border',
        light: 'bg-red-50 border-red-200',
        dark: 'bg-red-900/20 border-red-800',
      })}
    >
      <p
        className={themeClassName(theme, {
          base: 'text-sm',
          light: 'text-red-700',
          dark: 'text-red-400',
        })}
      >
        {message}
      </p>
    </div>
  );
}

interface BrowseEmptyStateProps {
  theme: Theme;
  currentTheme: ThemeTokens;
  visible: boolean;
}

export function BrowseEmptyState({ theme, currentTheme, visible }: BrowseEmptyStateProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24">
      <div
        className={themeClassName(theme, {
          base: 'mb-6 p-6 rounded-full',
          light: 'bg-blue-100',
          dark: 'bg-blue-900/30',
        })}
      >
        <BookOpen
          className={themeClassName(theme, {
            base: 'w-12 h-12 md:w-16 md:h-16',
            light: 'text-purple-600',
            dark: 'text-purple-400',
          })}
        />
      </div>
      <h2 className={`${currentTheme.text} text-xl md:text-2xl mb-2`}>Start Your Search</h2>
      <p className={`${currentTheme.textMuted} text-center max-w-md px-4`}>
        Search for books by title, author, or topic to discover what's available in Finnish libraries
      </p>
    </div>
  );
}

interface BrowseLoadingStateProps {
  currentTheme: ThemeTokens;
  visible: boolean;
}

export function BrowseLoadingState({ currentTheme, visible }: BrowseLoadingStateProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24">
      <Loader2 className={`w-12 h-12 md:w-16 md:h-16 ${currentTheme.textMuted} animate-spin mb-4`} />
      <p className={`${currentTheme.textMuted}`}>Searching Finnish libraries...</p>
    </div>
  );
}

interface BrowseResultsSectionProps {
  currentTheme: ThemeTokens;
  filteredBooks: FinnaBook[];
  displayBooks: FinnaBook[];
  searchQuery: string;
  getClosestAvailableLocation: (book: FinnaBook) => BuildingInfo | null;
  isInWishlist: (bookId: string | number) => boolean;
  onSelectBook: (book: FinnaBook) => void;
  onAddToWishlist: (book: FinnaBook) => void;
}

export function BrowseResultsSection({
  currentTheme,
  filteredBooks,
  displayBooks,
  searchQuery,
  getClosestAvailableLocation,
  isInWishlist,
  onSelectBook,
  onAddToWishlist,
}: BrowseResultsSectionProps) {
  if (filteredBooks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className={`mb-2 md:mb-4 ${currentTheme.textMuted} text-sm`}
      >
        Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'result' : 'results'}
        {searchQuery && ` for "${searchQuery}"`}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        {displayBooks.map((book) => (
          <BookResultCard
            key={book.id}
            book={book}
            closestLocation={getClosestAvailableLocation(book)}
            isInWishlist={isInWishlist(book.id)}
            onSelect={onSelectBook}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>
    </div>
  );
}

interface BrowseFilteredEmptyStateProps {
  theme: Theme;
  currentTheme: ThemeTokens;
  show: boolean;
}

export function BrowseFilteredEmptyState({ theme, currentTheme, show }: BrowseFilteredEmptyStateProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className={`${currentTheme.textMuted} text-center`}>No books match your current filters. Try adjusting your selection.</p>
      <p
        className={themeClassName(theme, {
          base: 'mt-4 text-sm font-medium',
          light: 'text-purple-600',
          dark: 'text-purple-400',
        })}
      >
        Tip: Clear filters to see all results again.
      </p>
    </div>
  );
}

interface BrowseNoSearchResultsProps {
  currentTheme: ThemeTokens;
  show: boolean;
}

export function BrowseNoSearchResults({ currentTheme, show }: BrowseNoSearchResultsProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className={`${currentTheme.text} text-lg mb-2`}>No books found</p>
      <p className={`${currentTheme.textMuted} text-center max-w-md`}>
        Try a different search term or check your spelling
      </p>
    </div>
  );
}
