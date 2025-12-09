import { Plus, Trash2, TrendingUp, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { BookCard } from '../book/BookCard';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import type { ReadingBook, BookId } from '../../contexts/BooksContext';

interface ReadingListSectionProps {
  books: ReadingBook[];
  onUpdateProgress: (book: ReadingBook) => void;
  onMarkComplete: (book: ReadingBook) => void;
  onRemove: (bookId: BookId) => void;
  onAddBook: () => void;
}

export function ReadingListSection({
  books,
  onUpdateProgress,
  onMarkComplete,
  onRemove,
  onAddBook,
}: ReadingListSectionProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
      {books.map((book) => (
        <BookCard
          key={book.id}
          image={book.image}
          title={book.title}
          shadow="deep"
          coverClassName="rounded-2xl"
          footer={
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => onUpdateProgress(book)}
                className={themeClassName(theme, {
                  base: 'w-full text-sm py-2 rounded-lg',
                  light:
                    'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300',
                  dark:
                    'bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-700/60 hover:border-slate-600',
                })}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Update Progress
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onMarkComplete(book)}
                  className={themeClassName(theme, {
                    base: 'flex-1 text-sm py-2 rounded-lg',
                    light:
                      'bg-white border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300',
                    dark:
                      'bg-slate-800/40 border-slate-700/50 text-green-400 hover:bg-green-900/20 hover:border-green-500/50',
                  })}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Complete</span>
                  <span className="md:hidden">✓</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onRemove(book.id)}
                  className={themeClassName(theme, {
                    base: 'rounded-lg',
                    light:
                      'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300',
                    dark:
                      'bg-slate-800/40 border-slate-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-500/50',
                  })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          }
        >
          <div
            className={themeClassName(theme, {
              base: 'backdrop-blur-sm rounded-lg p-3 border',
              light: 'bg-white/60 border-blue-100',
              dark: 'bg-slate-800/40 border-slate-700/50',
            })}
          >
            <div className={`${currentTheme.text} text-xs mb-2`}>Progress: {book.progress}%</div>
            <div
              className={themeClassName(theme, {
                base: 'w-full rounded-full h-2',
                light: 'bg-blue-100',
                dark: 'bg-slate-700',
              })}
            >
              <div
                className={`${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-500'
                } h-2 rounded-full transition-all duration-300`}
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
          <h3
            className={themeClassName(theme, {
              base: 'text-sm font-medium',
              light: currentTheme.text,
              dark: 'text-white',
            })}
          >
            {book.title}
          </h3>
          <p
            className={themeClassName(theme, {
              base: 'text-xs',
              light: currentTheme.textMuted,
              dark: 'text-slate-300',
            })}
          >
            {book.author}
          </p>
          <div className={`${currentTheme.textMuted} text-xs`}>Due: {book.dueDate}</div>
        </BookCard>
      ))}
      <button
        onClick={onAddBook}
        className={themeClassName(theme, {
          base: 'aspect-[2/3] rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center group',
          light: 'border-blue-300 hover:border-blue-500',
          dark: 'border-slate-700 hover:border-blue-500',
        })}
      >
        <Plus
          className={themeClassName(theme, {
            base: 'w-12 h-12 transition-colors mb-2',
            light: 'text-cyan-400 group-hover:text-blue-600',
            dark: 'text-slate-600 group-hover:text-cyan-400',
          })}
        />
        <span
          className={themeClassName(theme, {
            base: 'transition-colors',
            light: 'text-cyan-400 group-hover:text-blue-600',
            dark: 'text-slate-600 group-hover:text-cyan-400',
          })}
        >
          Add Book
        </span>
      </button>
    </div>
  );
}
