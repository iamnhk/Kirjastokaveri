import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import type { Book } from '../../contexts/BooksContext';
import type { BuildingInfo, FinnaBook } from '../../services/finnaApi';
import { formatDistance } from '../../services/geolocationService';
import { mockBuildings } from '../../services/mockData';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type TrackableBook = (Book | FinnaBook) & {
  buildings?: BuildingInfo[];
  trackedLibraries?: string[];
};

interface LibrarySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: TrackableBook;
  onLibrarySelection: (book: TrackableBook, selectedLibraries: string[]) => void;
}

export function LibrarySelectionModal({
  isOpen,
  onClose,
  book,
  onLibrarySelection,
}: LibrarySelectionModalProps) {
  const { theme, currentTheme } = useThemeTokens();
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>(book?.trackedLibraries || []);

  const libraryOptions = useMemo(() => {
    const libraryMap = new Map<string, BuildingInfo>();

    if (book?.buildings) {
      for (const library of book.buildings) {
        libraryMap.set(library.building, library);
      }
    }

    if (book?.trackedLibraries) {
      for (const libraryName of book.trackedLibraries) {
        if (libraryMap.has(libraryName)) {
          continue;
        }

        const fallbackInfo = mockBuildings.find((b) => b.building === libraryName);
        libraryMap.set(libraryName, {
          building: libraryName,
          location: fallbackInfo?.location || 'Tracked library',
          available: fallbackInfo?.available ?? 0,
          total: fallbackInfo?.total ?? 0,
          callnumber: fallbackInfo?.callnumber,
          distance: fallbackInfo?.distance,
        });
      }
    }

    return Array.from(libraryMap.values());
  }, [book]);

  const bookTitle = book?.title || 'this book';

  // Sync selected libraries when book changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedLibraries(book?.trackedLibraries || []);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [book?.trackedLibraries]);

  const toggleLibrary = (libraryName: string) => {
    setSelectedLibraries((prev) =>
      prev.includes(libraryName) ? prev.filter((library) => library !== libraryName) : [...prev, libraryName]
    );
  };

  const handleConfirm = () => {
    if (selectedLibraries.length === 0) {
      return;
    }
    onLibrarySelection(book, selectedLibraries);
    onClose();
    setSelectedLibraries([]);
  };

  const handleCancel = () => {
    onClose();
    setSelectedLibraries([]);
  };

  const sortedLibraries = [...libraryOptions].sort((a, b) => {
    if (a.available > 0 && b.available === 0) return -1;
    if (a.available === 0 && b.available > 0) return 1;
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className={`${currentTheme.cardBg} ${currentTheme.border} max-w-2xl max-h-[80vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className={currentTheme.text}>
            {book?.trackedLibraries && book.trackedLibraries.length > 0
              ? 'Edit Tracked Libraries'
              : 'Select Libraries to Track'}
          </DialogTitle>
          <DialogDescription className={currentTheme.textMuted}>
            Choose which libraries you want to track for <span className="font-medium">{bookTitle}</span>. You'll
            be notified when the book becomes available at your selected libraries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {sortedLibraries.length === 0 ? (
            <div className={`text-center py-8 ${currentTheme.textMuted}`}>
              No library information available for this book
            </div>
          ) : (
            sortedLibraries.map((library) => {
              const isSelected = selectedLibraries.includes(library.building);
              const isAvailable = library.available > 0;

              return (
                <button
                  key={library.building}
                  onClick={() => toggleLibrary(library.building)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? theme === 'light'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-blue-500 bg-blue-900/30'
                      : theme === 'light'
                      ? 'border-slate-200 bg-white hover:border-blue-300'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : theme === 'light'
                            ? 'border-slate-300'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-medium ${currentTheme.text}`}>{library.building}</h3>
                        <Badge
                          className={`shrink-0 ${
                            isAvailable ? 'bg-cyan-400 text-slate-900' : 'bg-slate-400 text-slate-900'
                          }`}
                        >
                          {isAvailable ? `${library.available} available` : 'Not Available'}
                        </Badge>
                      </div>

                      {library.location && (
                        <p className={`text-sm ${currentTheme.textMuted} mb-2`}>{library.location}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        {library.distance !== undefined && (
                          <div
                            className={`flex items-center gap-1 ${
                              theme === 'light' ? 'text-green-700' : 'text-green-400'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{formatDistance(library.distance)} away</span>
                          </div>
                        )}

                        <div className={currentTheme.textMuted}>{library.total} total copies</div>

                        {library.callnumber && (
                          <div className={`text-xs ${currentTheme.textMuted}`}>{library.callnumber}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedLibraries.length === 0}
            className={`flex-1 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Track {selectedLibraries.length > 0 && `(${selectedLibraries.length})`}{' '}
            {selectedLibraries.length === 1 ? 'Library' : 'Libraries'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
