import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBooks } from '../../contexts/BooksContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFinnaSearch } from '../../hooks/useFinnaSearch';
import { ensureBookShape, mergeFinnaMeta, isFinnaBook } from '../../utils/bookAdapters';
import { recommendationEngine } from '../../services/recommendationEngine';
import { initializeAvailabilityTracking } from '../../services/availabilityMonitor';
import type { FinnaBook } from '../../services/finnaApi';
import type { FeatureDefinition } from './HomeSections';
import { Search, Globe, BookMarked, Bell } from 'lucide-react';
import type { Book } from '../../contexts/BooksContext';

const HERO_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
];

const FEATURE_CARDS: FeatureDefinition[] = [
  { icon: Search, title: 'Search & Filter', description: 'Find books by title, author, or topic' },
  { icon: Globe, title: 'Real-time Availability', description: 'See which libraries have copies now' },
  { icon: BookMarked, title: 'Save & Track', description: 'Build your reading lists' },
  { icon: Bell, title: 'Get Notified', description: 'Alerts when books become available' },
];

type TabKey = 'trending' | 'new' | 'picks' | 'recommended';

export function useHomeController() {
  const { addToWishlist, isInWishlist, readingList, wishlist, completedList } = useBooks();
  const { isAuthenticated } = useAuth();
  const { books, isLoading, error, loadTrending } = useFinnaSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<FinnaBook | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('trending');
  const [displayBooks, setDisplayBooks] = useState<FinnaBook[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookForLibrarySelection, setBookForLibrarySelection] = useState<FinnaBook | null>(null);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  useEffect(() => {
    if (books.length === 0) {
      setDisplayBooks([]);
      return;
    }

    recommendationEngine.updateProfile(readingList, wishlist, completedList);

    const computeDisplayBooks = () => {
      if (activeTab === 'trending') {
        return books.slice(0, 12);
      }

      if (activeTab === 'new') {
        const currentYear = new Date().getFullYear();
        const recent = books
          .filter((book) => {
            if (!book.year) return false;
            const year = parseInt(book.year, 10);
            return !Number.isNaN(year) && currentYear - year <= 5;
          })
          .sort((a, b) => (parseInt(b.year || '0', 10) - parseInt(a.year || '0', 10)))
          .slice(0, 12);
        return recent.length > 0 ? recent : books.slice(0, 12);
      }

      if (activeTab === 'picks') {
        const picks = books
          .filter((book) => (book.buildings?.reduce((total, building) => total + (building.available || 0), 0) || 0) > 0)
          .slice(0, 12);
        return picks.length > 0 ? picks : books.slice(0, 12);
      }

      if (activeTab === 'recommended' && isAuthenticated) {
        const personalized = recommendationEngine.getPersonalizedRecommendations(books, 12);
        if (personalized.length > 0) {
          return personalized.map((item) => item.book);
        }

        const userBooks = [...readingList, ...wishlist];
        if (userBooks.length > 0) {
          return books
            .filter(
              (book) =>
                !readingList.some((item) => item.id === book.id) &&
                !wishlist.some((item) => item.id === book.id) &&
                !completedList.some((item) => item.id === book.id),
            )
            .slice(0, 12);
        }
      }

      return books.slice(0, 12);
    };

    setDisplayBooks(computeDisplayBooks());
  }, [activeTab, books, isAuthenticated, readingList, wishlist, completedList]);

  const openAuthModal = useCallback(() => setShowAuthModal(true), []);
  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);

  const openBookDetail = useCallback((book: FinnaBook) => {
    setSelectedBook(book);
  }, []);

  const closeBookDetail = useCallback(() => {
    setSelectedBook(null);
  }, []);

  const handleAddToWishlist = useCallback(
    (book: FinnaBook | Book) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to add books to your lists');
        openAuthModal();
        return;
      }

      // If book has library availability, show library selection modal
      if (isFinnaBook(book) && book.buildings && book.buildings.length > 0) {
        setBookForLibrarySelection(book);
        return;
      }

      // Otherwise add directly to wishlist
      const normalizedBook = mergeFinnaMeta(ensureBookShape(book), book);
      addToWishlist(normalizedBook);
    },
    [addToWishlist, isAuthenticated, openAuthModal],
  );

  const handleTrackLibraries = useCallback(
    (book: FinnaBook | Book, selectedLibraries: string[]) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to track libraries');
        openAuthModal();
        return;
      }

      (async () => {
        try {
          // Add to wishlist with tracked libraries
          const normalizedBook = mergeFinnaMeta(ensureBookShape(book), book);
          const wishlistEntry = {
            ...normalizedBook,
            trackedLibraries: selectedLibraries,
          } as Book;

          addToWishlist(wishlistEntry);

          // Initialize availability tracking
          const finnaId = (book as FinnaBook).id || String(book.id);
          await initializeAvailabilityTracking(wishlistEntry, finnaId);

          toast.success(
            `Tracking ${selectedLibraries.length} ${
              selectedLibraries.length === 1 ? 'library' : 'libraries'
            } for "${book.title}"`
          );
          setBookForLibrarySelection(null);
          closeBookDetail();
        } catch (error) {
          console.error('Error tracking libraries:', error);
          toast.error('Failed to initialize library tracking. Please try again.');
          setBookForLibrarySelection(null);
        }
      })();
    },
    [addToWishlist, isAuthenticated, openAuthModal, closeBookDetail],
  );

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      window.location.hash = `/browse?q=${encodeURIComponent(searchQuery)}`;
    }
  }, [searchQuery]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleViewAll = useCallback(() => {
    window.location.hash = '#/browse';
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const heroBackgrounds = useMemo(() => HERO_BACKGROUNDS, []);

  return {
    hero: {
      searchQuery,
      onSearchChange: handleSearchChange,
      onSearch: handleSearch,
      backgroundBookCovers: heroBackgrounds,
    },
    features: FEATURE_CARDS,
    popular: {
      activeTab,
      onTabChange: handleTabChange,
      isAuthenticated,
      books: displayBooks,
      isLoading,
      error,
      onViewAll: handleViewAll,
      onSelectBook: openBookDetail,
      onAddToWishlist: handleAddToWishlist,
      isInWishlist,
    },
    modals: {
      auth: {
        isOpen: showAuthModal,
        open: openAuthModal,
        close: closeAuthModal,
      },
      detail: {
        book: selectedBook,
        isOpen: selectedBook !== null,
        open: openBookDetail,
        close: closeBookDetail,
      },
      librarySelection: {
        book: bookForLibrarySelection,
        setBook: setBookForLibrarySelection,
        isOpen: bookForLibrarySelection !== null,
      },
    },
    books,
    wishlist: {
      add: handleAddToWishlist,
      isInWishlist,
      trackLibraries: handleTrackLibraries,
    },
  };
}
