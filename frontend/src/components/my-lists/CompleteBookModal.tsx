import { Button } from '../ui/button';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { MyListsModalShell } from './MyListsModalShell';
import { themeClassName } from '../../utils/themeClassName';
import type { ReadingBook } from '../../contexts/BooksContext';

interface CompleteBookModalProps {
  book: ReadingBook;
  rating: number;
  onRatingChange: (rating: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function CompleteBookModal({
  book,
  rating,
  onRatingChange,
  onClose,
  onConfirm,
}: CompleteBookModalProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <MyListsModalShell
      title="Mark as Complete"
      subtitle={book.title}
      footer={
        <>
          <Button
            onClick={onClose}
            variant="outline"
            className={themeClassName(theme, {
              base: 'flex-1',
              light: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
              dark: 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-700/60',
            })}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
          >
            Complete
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <p className={`${currentTheme.text} text-sm mb-3`}>Rate this book:</p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRatingChange(star)}
              className="transition-transform hover:scale-110"
            >
              <svg
                className={`w-10 h-10 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : theme === 'light'
                      ? 'text-gray-300'
                      : 'text-slate-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  fill={star <= rating ? 'currentColor' : 'none'}
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </MyListsModalShell>
  );
}
