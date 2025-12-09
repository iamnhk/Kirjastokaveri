import type { ReactNode } from 'react';
import { BookMarked, Calendar, Check, Trash2, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BookCard } from '../book/BookCard';
import { useThemeTokens, type Theme } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import type { ReservedBook, BookId } from '../../contexts/BooksContext';

type ThemeTokens = ReturnType<typeof useThemeTokens>['currentTheme'];

interface ReservationsSectionProps {
  books: ReservedBook[];
  onPickUp: (bookId: BookId) => void;
  onUpdateStatus: (bookId: BookId, status: ReservedBook['status']) => void;
  onRemove: (bookId: BookId) => void;
  onStartReading: (bookId: BookId) => void;
}

const STATUS_META: Record<ReservedBook['status'], { label: string; badgeClass: string }> = {
  reserved: { label: 'Reserved', badgeClass: 'bg-blue-500' },
  'picked-up': { label: 'Picked Up', badgeClass: 'bg-green-500' },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-gray-500' },
};

interface ReservationCardProps extends Omit<ReservationsSectionProps, 'books'> {
  book: ReservedBook;
  theme: Theme;
  currentTheme: ThemeTokens;
}

function ReservationCard({
  book,
  theme,
  currentTheme,
  onPickUp,
  onUpdateStatus,
  onRemove,
  onStartReading,
}: ReservationCardProps) {
  const { badgeClass, label } = STATUS_META[book.status];

  const renderReservedActions = () => (
    <>
      <Button
        onClick={() => onPickUp(book.id)}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs md:text-sm py-2 rounded-lg shadow-lg"
      >
        <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        <span className="hidden md:inline">Pick Up from Library</span>
        <span className="md:hidden">Pick Up</span>
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onUpdateStatus(book.id, 'cancelled')}
          className={themeClassName(theme, {
            base: 'flex-1 text-xs md:text-sm py-2 rounded-lg',
            light:
              'bg-white border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300',
            dark:
              'bg-slate-800/40 border-slate-700/50 text-orange-400 hover:bg-orange-900/20 hover:border-orange-500/50',
          })}
        >
          <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
          <span className="hidden md:inline">Cancel</span>
          <span className="md:hidden">Cancel</span>
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
    </>
  );

  const renderPickedUpActions = () => (
    <>
      {book.dueDate && (
        <div className={`${currentTheme.textMuted} text-xs mb-2 text-center`}>Due: {book.dueDate}</div>
      )}
      <Button
        onClick={() => onStartReading(book.id)}
        className={`w-full bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} text-xs md:text-sm py-2 rounded-lg shadow-lg ${
          theme === 'light' ? 'shadow-blue-300/50' : ''
        }`}
      >
        <BookMarked className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        <span className="hidden md:inline">Start Reading</span>
        <span className="md:hidden">Start</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => onRemove(book.id)}
        className={themeClassName(theme, {
          base: 'w-full text-xs md:text-sm py-2 rounded-lg',
          light: 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300',
          dark: 'bg-slate-800/40 border-slate-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-500/50',
        })}
      >
        <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        Remove
      </Button>
    </>
  );

  const renderCancelledActions = () => (
    <Button
      variant="outline"
      onClick={() => onRemove(book.id)}
      className={themeClassName(theme, {
        base: 'w-full text-xs md:text-sm py-2 rounded-lg',
        light: 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300',
        dark: 'bg-slate-800/40 border-slate-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-500/50',
      })}
    >
      <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
      Remove
    </Button>
  );

  const statusActionRenderer: Record<ReservedBook['status'], () => ReactNode> = {
    reserved: renderReservedActions,
    'picked-up': renderPickedUpActions,
    cancelled: renderCancelledActions,
  };

  return (
    <BookCard
      image={book.image}
      title={book.title}
      shadow="deep"
      coverClassName="rounded-2xl"
      overlay={
        <>
          <Badge className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full ${badgeClass} text-white`}>
            {label}
          </Badge>
          <div
            className={themeClassName(theme, {
              base: 'absolute bottom-2 md:bottom-3 left-2 md:left-3 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full',
              light: 'bg-white/90',
              dark: 'bg-slate-900/80',
            })}
          >
            <span className={`text-xs md:text-sm ${currentTheme.textMuted}`}>{book.reservedDate}</span>
          </div>
        </>
      }
      footer={<div className="flex flex-col gap-2">{statusActionRenderer[book.status]()}</div>}
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
          base: 'text-xs',
          light: currentTheme.textMuted,
          dark: 'text-slate-300',
        })}
      >
        {book.author}
      </p>
    </BookCard>
  );
}

export function ReservationsSection({
  books,
  onPickUp,
  onUpdateStatus,
  onRemove,
  onStartReading,
}: ReservationsSectionProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
      {books.length === 0 ? (
        <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12">
          <Calendar className={`w-16 h-16 mx-auto mb-4 ${currentTheme.textMuted}`} />
          <p className={`${currentTheme.text} text-lg mb-2`}>No reservations yet</p>
          <p className={`${currentTheme.textMuted} text-sm`}>
            Reserve books from the Browse page to track them here
          </p>
        </div>
      ) : (
        books.map((book) => (
          <ReservationCard
            key={book.id}
            book={book}
            theme={theme}
            currentTheme={currentTheme}
            onPickUp={onPickUp}
            onUpdateStatus={onUpdateStatus}
            onRemove={onRemove}
            onStartReading={onStartReading}
          />
        ))
      )}
    </div>
  );
}
