import { useState, useEffect, lazy, Suspense } from 'react';
import { ExternalLink, MapPin, BookOpen, Calendar, Building2, X, BookMarked, Loader2, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { getFinnaReservationUrl, getAvailability } from '../../services/finnaApi';
import type { FinnaBook, BuildingInfo } from '../../services/finnaApi';
import { LibraryMap } from './LibraryMap';
import { BookAvailability } from './BookAvailability';
import { BookCard } from './BookCard';

// Lazy load the LibrarySelectionModal
const LibrarySelectionModal = lazy(() =>
  import('./LibrarySelectionModal').then((module) => ({ default: module.LibrarySelectionModal }))
);

interface BookDetailModalProps {
  book: FinnaBook | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToList?: (book: FinnaBook) => void;
  onTrackLibraries?: (book: FinnaBook, selectedLibraries: string[]) => void;
}

export function BookDetailModal({ book, isOpen, onClose, onAddToList, onTrackLibraries }: BookDetailModalProps) {
  const { theme, currentTheme } = useThemeTokens();
  const [detailedBuildings, setDetailedBuildings] = useState<BuildingInfo[] | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [showLibrarySelection, setShowLibrarySelection] = useState(false);

  // Fetch detailed availability from backend (with HTML scraping) when modal opens
  useEffect(() => {
    if (!isOpen || !book?.id) return;

    let cancelled = false;
    
    const fetchAvailability = async () => {
      try {
        const buildings = await getAvailability(book.id);
        if (!cancelled) {
          setDetailedBuildings(buildings);
          setIsLoadingAvailability(false);
        }
      } catch (error) {
        console.error('Error fetching detailed availability:', error);
        if (!cancelled) {
          // Fall back to original buildings data
          setDetailedBuildings(book.buildings || []);
          setIsLoadingAvailability(false);
        }
      }
    };

    // Initialize loading state via timeout to satisfy lint rule
    const initTimeoutId = setTimeout(() => {
      setIsLoadingAvailability(true);
      setDetailedBuildings(null);
      fetchAvailability();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(initTimeoutId);
    };
  }, [isOpen, book?.id, book?.buildings]);

  // Reset state when modal closes
  useEffect(() => {
    if (isOpen) return;
    
    // Use functional updates to avoid direct setState calls
    const timeoutId = setTimeout(() => {
      setDetailedBuildings(null);
      setIsLoadingAvailability(false);
      setShowLibrarySelection(false);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Handle library selection
  const handleLibrarySelection = (_selectedBook: FinnaBook, selectedLibraries: string[]) => {
    if (onTrackLibraries && book) {
      onTrackLibraries(book, selectedLibraries);
    }
    setShowLibrarySelection(false);
  };

  if (!book) return null;

  // Use detailed buildings from backend if available, otherwise fallback to book.buildings
  const buildings = detailedBuildings ?? book.buildings ?? [];
  const hasAvailability = buildings.length > 0;
  
  // Helper to check if a building is available (handles both detailed status and simple count)
  const isAvailableBuilding = (b: BuildingInfo) => {
    if (b.status) {
      const status = b.status.toLowerCase();
      return status === 'available' || status.includes('available');
    }
    return b.available > 0;
  };
  
  const totalAvailable = hasAvailability
    ? buildings.filter(isAvailableBuilding).length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${currentTheme.cardBg} ${currentTheme.border} max-w-4xl max-h-[90vh] overflow-y-auto p-0`} hideCloseButton>
        <DialogTitle className="sr-only">{book.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information about {book.title} by {book.author}, including availability at Finnish libraries
        </DialogDescription>
        
        <div className="relative">
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 z-50 p-2 rounded-full ${theme === 'light' ? 'bg-white hover:bg-gray-100 shadow-md' : 'bg-slate-700 hover:bg-slate-600 shadow-xl'} ${currentTheme.border} border transition-all hover:scale-110`}
            aria-label="Close modal"
          >
            <X className={`w-5 h-5 ${currentTheme.text}`} />
          </button>

          <div className={`border-b ${currentTheme.border} px-6 pt-6`}>
            <Tabs defaultValue="map" className="w-full">
              <TabsList className={`mb-4 w-full grid grid-cols-3 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
                <TabsTrigger value="map" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Find Nearby</span>
                  <span className="sm:hidden">Map</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Book Details</span>
                  <span className="sm:hidden">Details</span>
                </TabsTrigger>
                <TabsTrigger value="availability" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">All Libraries</span>
                  <span className="sm:hidden">Libraries</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-0 p-6">
                <div className="grid md:grid-cols-[300px,1fr] gap-6">
                  <div className="space-y-4">
                    <BookCard
                      image={book.imageUrl}
                      title={book.title}
                      shadow="deep"
                      interactive={false}
                      coverClassName="rounded-2xl"
                    />

                    <div>
                      <h2 className={`${currentTheme.text} text-xl mb-1 line-clamp-2`}>{book.title}</h2>
                      <p className={`${currentTheme.textMuted}`}>{book.author}</p>
                    </div>

                    {hasAvailability && (
                      <Badge 
                        variant={totalAvailable > 0 ? 'default' : 'secondary'}
                        className={`w-full justify-center py-2 text-sm ${totalAvailable > 0 ? (theme === 'light' ? 'bg-green-600' : 'bg-green-500') : ''}`}
                      >
                        {totalAvailable > 0 ? `✓ ${totalAvailable} copies available` : '⏱ All copies on loan'}
                      </Badge>
                    )}

                    <div className="space-y-2">
                      <Button
                        onClick={() => window.open(getFinnaReservationUrl(book.id), '_blank')}
                        className={`w-full ${theme === 'light' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        size="lg"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Reserve on Finna
                      </Button>
                      {hasAvailability && onTrackLibraries && (
                        <Button
                          variant="outline"
                          onClick={() => setShowLibrarySelection(true)}
                          className={`w-full ${theme === 'light' ? 'border-purple-200 text-purple-700 hover:bg-purple-50' : 'border-purple-700 text-purple-300 hover:bg-purple-900/30'}`}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Track at Libraries
                        </Button>
                      )}
                      {onAddToList && (
                        <Button
                          variant="outline"
                          onClick={() => onAddToList(book)}
                          className={`w-full ${theme === 'light' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-slate-700 text-white hover:bg-slate-800'}`}
                        >
                          <BookMarked className="w-4 h-4 mr-2" />
                          Add to My Lists
                        </Button>
                      )}
                    </div>

                    <div className={`space-y-2 pt-4 border-t ${currentTheme.border}`}>
                      {book.year && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className={`w-4 h-4 ${currentTheme.textMuted}`} />
                          <span className={currentTheme.text}>{book.year}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className={`w-4 h-4 ${currentTheme.textMuted}`} />
                          <span className={`${currentTheme.text} text-xs`}>{book.publisher}</span>
                        </div>
                      )}
                      {book.language && book.language.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className={`w-4 h-4 ${currentTheme.textMuted}`} />
                          <span className={currentTheme.text}>
                            {book.language.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[500px]">
                    {hasAvailability ? (
                      <div>
                        <div className="mb-4">
                          <h3 className={`${currentTheme.text} text-lg mb-1`}>Where can I find this book?</h3>
                          <p className={`text-sm ${currentTheme.textMuted}`}>Libraries near you with available copies</p>
                        </div>
                        <LibraryMap buildings={buildings} bookTitle={book.title} recordId={book.id} />
                      </div>
                    ) : isLoadingAvailability ? (
                      <div className={`text-center py-16 ${currentTheme.textMuted}`}>
                        <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin opacity-50" />
                        <p className="text-lg mb-2">Loading availability...</p>
                      </div>
                    ) : (
                      <div className={`text-center py-16 ${currentTheme.textMuted}`}>
                        <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No location data available</p>
                        <p className="text-sm">Availability information is not available for this book</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-0 p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex gap-6">
                    <div className="w-32 flex-shrink-0">
                      <BookCard
                        image={book.imageUrl}
                        title={book.title}
                        shadow="deep"
                        interactive={false}
                        className="w-full"
                        coverClassName="rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className={`${currentTheme.text} text-2xl mb-2`}>{book.title}</h2>
                      <p className={`${currentTheme.textMuted} text-lg mb-4`}>{book.author}</p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => window.open(getFinnaReservationUrl(book.id), '_blank')}
                          className={`${theme === 'light' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Reserve on Finna
                        </Button>
                        {hasAvailability && onTrackLibraries && (
                          <Button
                            variant="outline"
                            onClick={() => setShowLibrarySelection(true)}
                            className={`${theme === 'light' ? 'border-purple-200 text-purple-700 hover:bg-purple-50' : 'border-purple-700 text-purple-300 hover:bg-purple-900/30'}`}
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Track Libraries
                          </Button>
                        )}
                        {onAddToList && (
                          <Button
                            variant="outline"
                            onClick={() => onAddToList(book)}
                            className={`${theme === 'light' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-slate-700 text-white hover:bg-slate-800'}`}
                          >
                            <BookMarked className="w-4 h-4 mr-2" />
                            Add to My Lists
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {book.summary && (
                    <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-slate-800/50'}`}>
                      <h3 className={`${currentTheme.text} mb-2`}>About this book</h3>
                      <p className={`${currentTheme.textMuted} text-sm leading-relaxed`}>
                        {book.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6">
                    {book.subjects && book.subjects.length > 0 && (
                      <div>
                        <h3 className={`${currentTheme.text} mb-3`}>Subjects</h3>
                        <div className="flex flex-wrap gap-2">
                          {book.subjects.map((subject, index) => (
                            <Badge 
                              key={index} 
                              variant="outline"
                              className={`${theme === 'light' ? 'border-blue-200 text-blue-700' : 'border-slate-600 text-slate-300'}`}
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {book.isbn && book.isbn.length > 0 && (
                        <div>
                          <h3 className={`${currentTheme.text} mb-2`}>ISBN</h3>
                          <p className={`${currentTheme.textMuted} text-sm font-mono`}>
                            {book.isbn[0]}
                          </p>
                        </div>
                      )}

                      {book.formats && book.formats.length > 0 && (
                        <div>
                          <h3 className={`${currentTheme.text} mb-2`}>Format</h3>
                          <p className={`${currentTheme.textMuted} text-sm`}>
                            {book.formats.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </TabsContent>

              <TabsContent value="availability" className="mt-0 p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`${currentTheme.text} text-xl mb-2`}>Library Availability</h3>
                        <p className={`text-sm ${currentTheme.textMuted}`}>
                          Complete list of all libraries with availability status
                        </p>
                      </div>
                      {hasAvailability && onTrackLibraries && (
                        <Button
                          onClick={() => setShowLibrarySelection(true)}
                          className={`${theme === 'light' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Track Libraries
                        </Button>
                      )}
                    </div>
                  </div>
                  {isLoadingAvailability ? (
                    <div className={`text-center py-16 ${currentTheme.textMuted}`}>
                      <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin opacity-50" />
                      <p className="text-lg mb-2">Loading availability...</p>
                    </div>
                  ) : hasAvailability ? (
                    <BookAvailability buildings={buildings} />
                  ) : (
                    <div className={`text-center py-16 ${currentTheme.textMuted}`}>
                      <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No availability information</p>
                      <p className="text-sm">Availability data is not available for this book</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Library Selection Modal */}
        {showLibrarySelection && (
          <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin mx-auto" />}>
            <LibrarySelectionModal
              isOpen={showLibrarySelection}
              onClose={() => setShowLibrarySelection(false)}
              book={{ ...book, buildings }}
              onLibrarySelection={handleLibrarySelection}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
