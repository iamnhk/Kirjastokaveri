import { useThemeTokens } from '../../contexts/ThemeContext';

export type MyListsTab = 'reading' | 'wishlist' | 'reservations' | 'completed';

interface MyListsTabsProps {
  activeTab: MyListsTab;
  onTabChange: (tab: MyListsTab) => void;
}

const tabs: Array<{ id: MyListsTab; label: string }> = [
  { id: 'reading', label: 'Currently Reading' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'completed', label: 'Completed' },
];

export function MyListsTabs({ activeTab, onTabChange }: MyListsTabsProps) {
  const { theme, currentTheme } = useThemeTokens();

  return (
    <div className={`flex gap-2 md:gap-4 mb-6 md:mb-10 border-b ${currentTheme.border} overflow-x-auto scrollbar-hide`}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`px-4 md:px-6 py-3 relative transition-colors whitespace-nowrap ${
            activeTab === id ? currentTheme.text : `${currentTheme.textMuted} hover:${currentTheme.text}`
          }`}
        >
          <span className="text-sm md:text-base">{label}</span>
          {activeTab === id && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                theme === 'light' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-blue-500'
              }`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
