import { Button } from '../ui/button';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { MyListsModalShell } from './MyListsModalShell';
import { themeClassName } from '../../utils/themeClassName';
import type { ReadingBook, ReservedBook } from '../../contexts/BooksContext';

interface ReadingProgressModalProps {
  book: ReadingBook | ReservedBook;
  progress: number;
  onProgressChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ReadingProgressModal({
  book,
  progress,
  onProgressChange,
  onClose,
  onConfirm,
}: ReadingProgressModalProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <MyListsModalShell
      title="Update Reading Progress"
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
            Update
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className={`${currentTheme.text} text-sm`}>Progress</span>
          <span className={`${currentTheme.accentText} text-sm`}>{progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(event) => onProgressChange(parseInt(event.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${theme === 'light' ? '#9333ea' : '#a78bfa'} 0%, ${
              theme === 'light' ? '#9333ea' : '#a78bfa'
            } ${progress}%, ${theme === 'light' ? '#e9d5ff' : '#475569'} ${progress}%, ${
              theme === 'light' ? '#e9d5ff' : '#475569'
            } 100%)`,
          }}
        />
      </div>
    </MyListsModalShell>
  );
}
