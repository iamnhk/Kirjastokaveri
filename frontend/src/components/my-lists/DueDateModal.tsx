import { Button } from '../ui/button';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import { MyListsModalShell } from './MyListsModalShell';
import type { ReservedBook } from '../../contexts/BooksContext';

interface DueDateModalProps {
  book: ReservedBook;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DueDateModal({ book, dueDate, onDueDateChange, onClose, onConfirm }: DueDateModalProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <MyListsModalShell
      title="Set Due Date"
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
            className={`flex-1 bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} shadow-lg ${
              theme === 'light' ? 'shadow-blue-300/50' : ''
            }`}
          >
            Start Reading
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <label htmlFor="due-date" className={`${currentTheme.text} text-sm mb-2 block`}>
          When is this book due?
        </label>
        <input
          id="due-date"
          type="date"
          value={dueDate}
          onChange={(event) => onDueDateChange(event.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${
            theme === 'light'
              ? 'bg-white border-blue-200 text-gray-900'
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
    </MyListsModalShell>
  );
}
