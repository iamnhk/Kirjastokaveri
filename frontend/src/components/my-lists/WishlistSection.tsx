import { Calendar, Check, Edit2, MapPin, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BookCard } from '../book/BookCard';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import type { WishlistBook, BookId } from '../../contexts/BooksContext';

interface WishlistSectionProps {
  books: WishlistBook[];
  onReserve: (book: WishlistBook) => void;
  onRemove: (bookId: BookId) => void;
  onEditTracking: (book: WishlistBook) => void;
}

export function WishlistSection({ books, onReserve, onRemove, onEditTracking }: WishlistSectionProps) {
  const { theme, currentTheme } = useThemeTokens();

  const renderTrackedLibraries = (book: WishlistBook) => {
    if (!book.trackedLibraries || book.trackedLibraries.length === 0) {
      return null;
    }

    return (
      <div
        className={themeClassName(theme, {
          base: 'p-2 rounded-lg',
          light: 'bg-blue-50 border border-blue-200',
          dark: 'bg-blue-900/20 border border-blue-500/30',
        })}
      >
        <div className="flex items-center gap-1 mb-1">
          <MapPin
            className={themeClassName(theme, {
              base: 'w-3 h-3',
              light: 'text-blue-600',
              dark: 'text-white',
            })}
          />
          <span
            className={themeClassName(theme, {
              base: 'text-xs font-medium',
              light: 'text-blue-700',
              dark: 'text-white',
            })}
          >
            Tracking {book.trackedLibraries.length}{' '}
            {book.trackedLibraries.length === 1 ? 'library' : 'libraries'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {book.trackedLibraries.slice(0, 2).map((lib, idx) => (
            <Badge
              key={`${book.id}-library-${idx}`}
              variant="outline"
              className={themeClassName(theme, {
                base: 'text-xs px-2 py-0',
                light: 'border-blue-300 text-blue-700 bg-white',
                dark: 'border-slate-600 text-white bg-slate-800/50',
              })}
            >
              {lib.length > 12 ? `${lib.substring(0, 12)}...` : lib}
            </Badge>
          ))}
          {book.trackedLibraries.length > 2 && (
            <Badge
              variant="outline"
              className={themeClassName(theme, {
                base: 'text-xs px-2 py-0',
                light: 'border-blue-300 text-blue-700 bg-white',
                dark: 'border-slate-600 text-white bg-slate-800/50',
              })}
            >
              +{book.trackedLibraries.length - 2}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
      {books.length === 0 ? (
        <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12">
          <Calendar className={`w-16 h-16 mx-auto mb-4 ${currentTheme.textMuted}`} />
          <p className={`${currentTheme.text} text-lg mb-2`}>No books in wishlist</p>
          <p className={`${currentTheme.textMuted} text-sm`}>
            Add books from the Browse page to start your wishlist
          </p>
        </div>
      ) : (
        books.map((book) => (
          <BookCard
            key={book.id}
            image={book.image}
            title={book.title}
            shadow="deep"
            interactive={false}
            className="text-left"
            coverClassName="rounded-2xl"
            overlay={
              <Badge
                className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full ${
                  book.availability === 'Available Now'
                    ? 'bg-cyan-400 text-slate-900'
                    : 'bg-yellow-400 text-slate-900'
                }`}
              >
                {book.availability}
              </Badge>
            }
            footer={
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() =>
                    window.open(
                      `https://finna.fi/Search/Results?lookfor=${encodeURIComponent(book.title)}`,
                      '_blank'
                    )
                  }
                  className={`w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} text-xs md:text-sm py-2 rounded-lg shadow-lg ${
                    theme === 'light' ? 'shadow-blue-300/50' : ''
                  }`}
                >
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Reserve on Finna
                </Button>

                {book.trackedLibraries && book.trackedLibraries.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => onEditTracking(book)}
                    className={themeClassName(theme, {
                      base: 'w-full text-xs md:text-sm py-2 rounded-lg',
                      light:
                        'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300',
                      dark:
                        'bg-slate-800/40 border-slate-700/50 text-cyan-400 hover:bg-blue-900/20 hover:border-blue-500/50',
                    })}
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Edit Tracking
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onReserve(book)}
                    className={themeClassName(theme, {
                      base: 'flex-1 text-xs md:text-sm py-2 rounded-lg',
                      light:
                        'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300',
                      dark:
                        'bg-slate-800/40 border-slate-700/50 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/50',
                    })}
                  >
                    <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span className="hidden md:inline">Mark Reserved</span>
                    <span className="md:hidden">Reserved</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemove(book.id)}
                    className={themeClassName(theme, {
                      base: 'rounded-lg',
                      light: 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300',
                      dark: 'bg-slate-800/40 border-slate-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-500/50',
                    })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            }
          >
            <h3
              className={themeClassName(theme, {
                base: 'text-sm line-clamp-2 font-medium',
                light: currentTheme.text,
                dark: 'text-white',
              })}
            >
              {book.title}
            </h3>
            <p
              className={themeClassName(theme, {
                base: 'text-xs line-clamp-1',
                light: currentTheme.textMuted,
                dark: 'text-slate-300',
              })}
            >
              {book.author}
            </p>
            {renderTrackedLibraries(book)}
          </BookCard>
        ))
      )}
    </div>
  );
}
