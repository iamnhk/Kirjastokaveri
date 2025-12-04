import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useBooks, type Book } from '../../contexts/BooksContext';
import { useFinnaSearch } from '../../hooks/useFinnaSearch';
import { useLocationBasedSearch } from '../../hooks/useLocationBasedSearch';
import { initializeAvailabilityTracking } from '../../services/availabilityMonitor';
import type { FinnaBook } from '../../services/finnaApi';
import { ensureBookShape, mergeFinnaMeta, isFinnaBook } from '../../utils/bookAdapters';
import { useFilteredBooks, type AvailabilityFilter } from '../../utils/bookFilters';

const GENRES = ['All', 'Fiction', 'Fantasy', 'Mystery', 'Romance', 'Science Fiction', 'Biography', 'History'];
const AVAILABILITY_OPTIONS: AvailabilityFilter[] = ['All', 'Available Now', 'Limited', 'Not Available'];

interface BrowseFilters {
  genres: string[];
  availabilityOptions: AvailabilityFilter[];
  selectedGenre: string;
  selectGenre: (genre: string) => void;
  selectedAvailability: AvailabilityFilter;
  selectAvailability: (value: AvailabilityFilter) => void;
}

interface BrowseSearch {
  query: string;
  inputValue: string;
  setInput: (value: string) => void;
  submit: () => void;
  isLoading: boolean;
  error: string | null;
  filteredBooks: FinnaBook[];
  displayBooks: FinnaBook[];
  allBooks: FinnaBook[];
  showEmptyState: boolean;
}

interface BrowseWishlist {
  add: (book: FinnaBook | Book) => void;
  isInWishlist: (bookId: string | number) => boolean;
  trackLibraries: (book: FinnaBook | Book, selectedLibraries: string[]) => void;
}

interface BrowseModals {
  auth: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };
  detail: {
    book: FinnaBook | null;
    setBook: (book: FinnaBook | null) => void;
    isOpen: boolean;
  };
  librarySelection: {
    book: FinnaBook | null;
    setBook: (book: FinnaBook | null) => void;
    isOpen: boolean;
  };
}

interface BrowseLocation {
  userLocation: ReturnType<typeof useLocationBasedSearch>['userLocation'];
  isLoading: boolean;
  request: () => void;
  permissionGranted: boolean;
  isUsingFallbackLocation: boolean;
  getClosestAvailableLocation: ReturnType<typeof useLocationBasedSearch>['getClosestAvailableLocation'];
}

interface BrowseViewState {
  showResults: boolean;
  showFilteredEmpty: boolean;
  showNoSearchResults: boolean;
}

export interface UseBrowseControllerReturn {
  filters: BrowseFilters;
  search: BrowseSearch;
  wishlist: BrowseWishlist;
  modals: BrowseModals;
  location: BrowseLocation;
  view: BrowseViewState;
}

export function useBrowseController(): UseBrowseControllerReturn {
  const { isAuthenticated } = useAuth();
  const { addToWishlist, isInWishlist } = useBooks();
  const { books, isLoading, error, search } = useFinnaSearch();
  const {
    userLocation,
    isLoadingLocation,
    locationPermissionGranted,
    isUsingFallbackLocation,
    requestLocation,
    enrichBooksWithDistance,
    getClosestAvailableLocation,
  } = useLocationBasedSearch();

  const [selectedGenre, selectGenre] = useState('All');
  const [selectedAvailability, selectAvailability] = useState<AvailabilityFilter>('All');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedBook, setSelectedBook] = useState<FinnaBook | null>(null);
  const [bookForLibrarySelection, setBookForLibrarySelection] = useState<FinnaBook | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const query = urlParams.get('q');

    if (query) {
      // Use timeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setSearchQuery(query);
        setInputValue(query);
        search({ lookfor: query, limit: 40 });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [search]);

  useEffect(() => {
    if (!locationPermissionGranted) {
      requestLocation();
    }
  }, [locationPermissionGranted, requestLocation]);

  const openAuthModal = useCallback(() => setShowAuthModal(true), []);
  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);

  const filteredBooks = useFilteredBooks({
    books,
    selectedGenre,
    selectedAvailability,
  });

  const displayBooks = useMemo(() => {
    return userLocation ? enrichBooksWithDistance(filteredBooks) : filteredBooks;
  }, [enrichBooksWithDistance, filteredBooks, userLocation]);

  const showEmptyState = useMemo(
    () => !searchQuery && books.length === 0 && !isLoading,
    [books.length, isLoading, searchQuery]
  );

  const submitSearch = useCallback(() => {
    if (!inputValue.trim()) {
      return;
    }

    setSearchQuery(inputValue);
    search({ lookfor: inputValue, limit: 40 });
  }, [inputValue, search]);

  const addBookToWishlist = useCallback(
    (book: FinnaBook | Book) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to add books to your lists');
        openAuthModal();
        return;
      }

      if (isFinnaBook(book) && book.buildings && book.buildings.length > 0) {
        setBookForLibrarySelection(book);
        return;
      }

      const normalizedBook = mergeFinnaMeta(ensureBookShape(book), book);
      addToWishlist(normalizedBook);
    },
    [addToWishlist, isAuthenticated, openAuthModal]
  );

  const trackLibraries = useCallback(
    (book: FinnaBook | Book, selectedLibraries: string[]) => {
      (async () => {
        const normalizedBook = mergeFinnaMeta(ensureBookShape(book), book);
        const wishlistEntry = {
          ...normalizedBook,
          availability: normalizedBook.availability ?? 'Available Now',
          trackedLibraries: selectedLibraries,
        };

        addToWishlist(wishlistEntry, selectedLibraries);

        try {
          await initializeAvailabilityTracking(
            wishlistEntry,
            wishlistEntry.finnaId ?? String(wishlistEntry.id)
          );
          toast.success(
            `Tracking ${selectedLibraries.length} ${
              selectedLibraries.length === 1 ? 'library' : 'libraries'
            } for "${book.title}"`
          );
        } catch (trackingError) {
          console.error('Error initializing tracking:', trackingError);
        }

        setBookForLibrarySelection(null);
      })();
    },
    [addToWishlist]
  );

  const view = useMemo<BrowseViewState>(() => {
    const hasFilteredResults = filteredBooks.length > 0;

    return {
      showResults: hasFilteredResults && !isLoading,
      showFilteredEmpty:
        !isLoading && !showEmptyState && !hasFilteredResults && books.length > 0,
      showNoSearchResults:
        !isLoading && Boolean(searchQuery) && books.length === 0 && !error,
    };
  }, [books.length, error, filteredBooks.length, isLoading, searchQuery, showEmptyState]);

  return {
    filters: {
      genres: GENRES,
      availabilityOptions: AVAILABILITY_OPTIONS,
      selectedGenre,
      selectGenre,
      selectedAvailability,
      selectAvailability,
    },
    search: {
      query: searchQuery,
      inputValue,
      setInput: setInputValue,
      submit: submitSearch,
      isLoading,
      error,
      filteredBooks,
      displayBooks,
      allBooks: books,
      showEmptyState,
    },
    wishlist: {
      add: addBookToWishlist,
      isInWishlist,
      trackLibraries,
    },
    modals: {
      auth: {
        isOpen: showAuthModal,
        open: openAuthModal,
        close: closeAuthModal,
      },
      detail: {
        book: selectedBook,
        setBook: setSelectedBook,
        isOpen: selectedBook !== null,
      },
      librarySelection: {
        book: bookForLibrarySelection,
        setBook: setBookForLibrarySelection,
        isOpen: bookForLibrarySelection !== null,
      },
    },
    location: {
      userLocation,
      isLoading: isLoadingLocation,
      request: requestLocation,
      permissionGranted: locationPermissionGranted,
      isUsingFallbackLocation,
      getClosestAvailableLocation,
    },
    view,
  };
}
