import { CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { BookCard } from '../book/BookCard';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import type { CompletedBook, BookId } from '../../contexts/BooksContext';

interface CompletedSectionProps {
  books: CompletedBook[];
  onReread: (bookId: BookId) => void;
  onRemove: (bookId: BookId) => void;
}

export function CompletedSection({ books, onReread, onRemove }: CompletedSectionProps) {
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
          overlay={
            <>
              <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div
                className={themeClassName(theme, {
                  base: 'absolute bottom-3 left-3 backdrop-blur-sm px-3 py-1 rounded-full',
                  light: 'bg-white/90',
                  dark: 'bg-slate-900/80',
                })}
              >
                <span className="text-yellow-400 text-sm">★ {book.rating}.0</span>
              </div>
            </>
          }
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onReread(book.id)}
                className={themeClassName(theme, {
                  base: 'flex-1 text-sm py-2 rounded-lg',
                  light:
                    'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300',
                  dark:
                    'bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-700/60 hover:border-slate-600',
                })}
              >
                Read Again
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
          }
        >
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
          <div className={`${currentTheme.textMuted} text-xs`}>Completed: {book.completedDate}</div>
        </BookCard>
      ))}
    </div>
  );
}
