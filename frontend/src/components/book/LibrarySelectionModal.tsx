import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Loader2 } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import type { Book } from '../../contexts/BooksContext';
import type { BuildingInfo, FinnaBook } from '../../services/finnaApi';
import { getAvailability } from '../../services/finnaApi';
import { formatDistance, getUserLocation } from '../../services/geolocationService';
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
  const [libraryData, setLibraryData] = useState<BuildingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real availability data when modal opens
  useEffect(() => {
    if (!isOpen || !book?.id) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        // Try to get user location for distance calculation
        let lat: number | undefined;
        let lon: number | undefined;
        try {
          const location = await getUserLocation();
          if (location) {
            lat = location.coordinates.latitude;
            lon = location.coordinates.longitude;
            console.log(`[LibrarySelectionModal] Got location: ${lat}, ${lon} (fallback: ${location.isFallback})`);
          }
        } catch (e) {
          // Location not available, continue without distance
          console.log('[LibrarySelectionModal] Location not available:', e);
        }

        // Fetch real availability from backend
        const bookId = 'finnaId' in book ? book.finnaId : book.id;
        console.log(`[LibrarySelectionModal] Fetching availability for ${bookId} with coords: ${lat}, ${lon}`);
        const availability = await getAvailability(String(bookId), lat, lon);
        
        console.log(`[LibrarySelectionModal] Got ${availability.length} items, ${availability.filter(a => a.distance !== undefined).length} with distance`);
        
        if (availability.length > 0) {
          setLibraryData(availability);
        } else {
          // Fallback to book.buildings if no availability data
          setLibraryData(book.buildings || []);
        }
      } catch (error) {
        console.error('[LibrarySelectionModal] Error fetching availability:', error);
        // Fallback to book.buildings
        setLibraryData(book.buildings || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [isOpen, book?.id]);

  const libraryOptions = useMemo(() => {
    const libraryMap = new Map<string, BuildingInfo>();

    // Use fetched library data (with real availability and distance)
    if (libraryData.length > 0) {
      for (const library of libraryData) {
        libraryMap.set(library.building, library);
      }
    } else if (book?.buildings) {
      // Fallback to book.buildings if no fetched data yet
      for (const library of book.buildings) {
        libraryMap.set(library.building, library);
      }
    }

    // Add tracked libraries that aren't in the data
    if (book?.trackedLibraries) {
      for (const libraryName of book.trackedLibraries) {
        if (libraryMap.has(libraryName)) {
          continue;
        }

        // Just create a basic entry for the tracked library
        libraryMap.set(libraryName, {
          building: libraryName,
          location: 'Tracked library',
          available: 0,
          total: 0,
        });
      }
    }

    return Array.from(libraryMap.values());
  }, [book, libraryData]);

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
        className={`${currentTheme.cardBg} ${currentTheme.border} max-w-3xl p-0 flex flex-col max-h-[90vh]`}
      >
        <div className="p-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className={`${currentTheme.text} text-2xl font-bold`}>
              {book?.trackedLibraries && book.trackedLibraries.length > 0
                ? 'Edit Tracked Libraries'
                : 'Select Libraries to Track'}
            </DialogTitle>
            <DialogDescription className={`${currentTheme.textMuted} text-base mt-2`}>
              Choose libraries to track for <span className="font-semibold text-blue-600">{bookTitle}</span>. 
              You'll be notified when the book becomes available.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-2 overflow-y-auto flex-1 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'light' ? '#cbd5e1 transparent' : '#475569 transparent'
          }}
        >
          {isLoading ? (
            <div className={`text-center py-12 ${currentTheme.textMuted}`}>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-lg">Loading library availability...</p>
            </div>
          ) : sortedLibraries.length === 0 ? (
            <div className={`text-center py-12 ${currentTheme.textMuted}`}>
              <p className="text-lg">No library information available for this book</p>
            </div>
          ) : (
            sortedLibraries.map((library) => {
              const isSelected = selectedLibraries.includes(library.building);
              const isAvailable = library.available > 0;
              const hasRealData = library.total > 0 || library.available > 0;

              return (
                <button
                  key={library.building}
                  onClick={() => toggleLibrary(library.building)}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left group ${
                    isSelected
                      ? theme === 'light'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-blue-500 bg-blue-950/40 shadow-sm shadow-blue-500/10'
                      : theme === 'light'
                      ? 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm'
                      : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-600 shadow-sm'
                            : theme === 'light'
                            ? 'border-2 border-slate-300 group-hover:border-blue-400'
                            : 'border-2 border-slate-600 group-hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`font-semibold text-base ${currentTheme.text} leading-tight`}>
                          {library.building}
                        </h3>
                        {hasRealData ? (
                          <Badge
                            className={`shrink-0 px-2.5 py-0.5 text-xs font-medium ${
                              isAvailable 
                                ? 'bg-emerald-500/90 text-white border-emerald-600' 
                                : 'bg-slate-400/90 text-white border-slate-500'
                            }`}
                          >
                            {isAvailable ? `${library.available} available` : 'Not Available'}
                          </Badge>
                        ) : (
                          <Badge
                            className="shrink-0 px-2.5 py-0.5 text-xs font-medium bg-blue-400/90 text-white border-blue-500"
                          >
                            Check Availability
                          </Badge>
                        )}
                      </div>

                      {library.location && library.location !== 'Tracked library' && (
                        <p className={`text-sm ${currentTheme.textMuted} mb-2.5`}>{library.location}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        {library.distance !== undefined && library.distance > 0 && (
                          <div
                            className={`flex items-center gap-1.5 font-medium ${
                              theme === 'light' ? 'text-green-700' : 'text-green-400'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{formatDistance(library.distance)} away</span>
                          </div>
                        )}

                        {hasRealData && (
                          <div className={`${currentTheme.textMuted} flex items-center gap-1`}>
                            <span className="font-medium">{library.total}</span> total
                          </div>
                        )}

                        {library.callnumber && (
                          <div className={`text-xs px-2 py-0.5 rounded ${
                            theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-slate-700/50 text-slate-300'
                          }`}>
                            {library.callnumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className={`p-6 pt-4 border-t shrink-0 ${theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800/50'}`}>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              className="flex-1 h-11 text-base font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedLibraries.length === 0}
              className={`flex-1 h-11 text-base font-medium shadow-sm ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedLibraries.length === 0 ? (
                'Select Libraries'
              ) : (
                <>Track {selectedLibraries.length} {selectedLibraries.length === 1 ? 'Library' : 'Libraries'}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
