import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useBooks,
  type BookId,
  type ReadingBook,
  type ReservedBook,
  type WishlistBook,
} from '../../contexts/BooksContext';
import { initializeAvailabilityTracking } from '../../services/availabilityMonitor';
import type { MyListsTab } from './MyListsTabs';

interface ProgressModalState {
  isOpen: boolean;
  book: ReadingBook | null;
  progress: number;
}

interface CompleteModalState {
  isOpen: boolean;
  book: ReadingBook | null;
  rating: number;
}

interface DueDateModalState {
  isOpen: boolean;
  book: ReservedBook | null;
  dueDate: string;
}

const INITIAL_PROGRESS_MODAL: ProgressModalState = {
  isOpen: false,
  book: null,
  progress: 0,
};

const INITIAL_COMPLETE_MODAL: CompleteModalState = {
  isOpen: false,
  book: null,
  rating: 5,
};

const INITIAL_DUE_DATE_MODAL: DueDateModalState = {
  isOpen: false,
  book: null,
  dueDate: '',
};

function getDefaultDueDate() {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 21);
  return defaultDate.toISOString().split('T')[0];
}

export function useMyListsController() {
  const navigate = useNavigate();
  const {
    readingList,
    wishlist,
    completedList,
    reservations,
    removeFromReading,
    removeFromWishlist,
    removeFromCompleted,
    removeFromReservations,
    updateReservationStatus,
    updateReadingProgress,
    addToReadingWithDueDate,
    addToReservations,
    moveToReading,
    moveToCompleted,
    updateWishlistLibraries,
  } = useBooks();

  const [activeTab, setActiveTab] = useState<MyListsTab>('reading');
  const [progressModalState, setProgressModalState] = useState<ProgressModalState>(INITIAL_PROGRESS_MODAL);
  const [completeModalState, setCompleteModalState] = useState<CompleteModalState>(INITIAL_COMPLETE_MODAL);
  const [dueDateModalState, setDueDateModalState] = useState<DueDateModalState>(INITIAL_DUE_DATE_MODAL);
  const [libraryModalBook, setLibraryModalBook] = useState<WishlistBook | null>(null);

  const openProgressModal = useCallback((book: ReadingBook) => {
    setProgressModalState({ isOpen: true, book, progress: book.progress });
  }, []);

  const setProgressValue = useCallback((value: number) => {
    setProgressModalState((prev) => (prev.book ? { ...prev, progress: value } : prev));
  }, []);

  const closeProgressModal = useCallback(() => {
    setProgressModalState(INITIAL_PROGRESS_MODAL);
  }, []);

  const confirmProgress = useCallback(() => {
    setProgressModalState((prev) => {
      if (prev.book) {
        updateReadingProgress(prev.book.id, prev.progress);
      }
      return INITIAL_PROGRESS_MODAL;
    });
  }, [updateReadingProgress]);

  const openCompleteModal = useCallback((book: ReadingBook) => {
    setCompleteModalState({ isOpen: true, book, rating: 5 });
  }, []);

  const setCompleteRating = useCallback((rating: number) => {
    setCompleteModalState((prev) => (prev.book ? { ...prev, rating } : prev));
  }, []);

  const closeCompleteModal = useCallback(() => {
    setCompleteModalState(INITIAL_COMPLETE_MODAL);
  }, []);

  const confirmComplete = useCallback(() => {
    setCompleteModalState((prev) => {
      if (prev.book) {
        moveToCompleted(prev.book.id, prev.rating);
      }
      return INITIAL_COMPLETE_MODAL;
    });
  }, [moveToCompleted]);

  const openDueDateModal = useCallback((book: ReservedBook) => {
    setDueDateModalState({ isOpen: true, book, dueDate: getDefaultDueDate() });
  }, []);

  const setDueDateValue = useCallback((value: string) => {
    setDueDateModalState((prev) => (prev.book ? { ...prev, dueDate: value } : prev));
  }, []);

  const closeDueDateModal = useCallback(() => {
    setDueDateModalState(INITIAL_DUE_DATE_MODAL);
  }, []);

  const confirmDueDate = useCallback(() => {
    setDueDateModalState((prev) => {
      if (prev.book && prev.dueDate) {
        updateReservationStatus(prev.book.id, 'picked-up', prev.dueDate);
      }
      return INITIAL_DUE_DATE_MODAL;
    });
  }, [updateReservationStatus]);

  const handlePickUp = useCallback(
    (bookId: BookId) => {
      const reservation = reservations.find((book) => book.id === bookId);
      if (reservation) {
        openDueDateModal(reservation);
      }
    },
    [reservations, openDueDateModal],
  );

  const handleReserve = useCallback(
    (book: WishlistBook) => {
      // Get the first tracked library if available
      const library = book.trackedLibraries?.[0];
      removeFromWishlist(book.id);
      // Pass library info so it syncs to backend
      addToReservations(book, library, library);
    },
    [removeFromWishlist, addToReservations],
  );

  const handleStartReading = useCallback(
    (bookId: BookId) => {
      const reservation = reservations.find((book) => book.id === bookId);
      if (reservation && reservation.dueDate) {
        removeFromReservations(bookId);
        addToReadingWithDueDate(reservation, reservation.dueDate);
      }
    },
    [reservations, removeFromReservations, addToReadingWithDueDate],
  );

  const openLibraryModal = useCallback((book: WishlistBook) => {
    setLibraryModalBook(book);
  }, []);

  const closeLibraryModal = useCallback(() => {
    setLibraryModalBook(null);
  }, []);

  const handleLibrarySelection = useCallback(
    (book: WishlistBook, selectedLibraries: string[]) => {
      (async () => {
        try {
          updateWishlistLibraries(book.id, selectedLibraries);

          // Initialize availability tracking for the updated libraries
          const finnaId = book.finnaId || String(book.id);
          await initializeAvailabilityTracking(
            { ...book, trackedLibraries: selectedLibraries },
            finnaId
          );

          toast.success(
            `Now tracking ${selectedLibraries.length} ${
              selectedLibraries.length === 1 ? 'library' : 'libraries'
            } for "${book.title}"`
          );
          setLibraryModalBook(null);
        } catch (error) {
          console.error('Error updating library tracking:', error);
          toast.error('Failed to update library tracking. Please try again.');
          setLibraryModalBook(null);
        }
      })();
    },
    [updateWishlistLibraries],
  );

  const navigateToBrowse = useCallback(() => {
    navigate('/browse');
  }, [navigate]);

  const progressModal = useMemo(
    () => ({
      ...progressModalState,
      open: openProgressModal,
      close: closeProgressModal,
      setProgress: setProgressValue,
      confirm: confirmProgress,
    }),
    [progressModalState, openProgressModal, closeProgressModal, setProgressValue, confirmProgress],
  );

  const completeModal = useMemo(
    () => ({
      ...completeModalState,
      open: openCompleteModal,
      close: closeCompleteModal,
      setRating: setCompleteRating,
      confirm: confirmComplete,
    }),
    [completeModalState, openCompleteModal, closeCompleteModal, setCompleteRating, confirmComplete],
  );

  const dueDateModal = useMemo(
    () => ({
      ...dueDateModalState,
      open: openDueDateModal,
      close: closeDueDateModal,
      setDate: setDueDateValue,
      confirm: confirmDueDate,
    }),
    [dueDateModalState, openDueDateModal, closeDueDateModal, setDueDateValue, confirmDueDate],
  );

  const libraryModal = useMemo(
    () => ({
      book: libraryModalBook,
      open: openLibraryModal,
      close: closeLibraryModal,
      submit: handleLibrarySelection,
    }),
    [libraryModalBook, openLibraryModal, closeLibraryModal, handleLibrarySelection],
  );

  return {
    readingList,
    wishlist,
    reservations,
    completedList,
    activeTab,
    setActiveTab,
    progressModal,
    completeModal,
    dueDateModal,
    libraryModal,
    removeFromReading,
    removeFromWishlist,
    removeFromCompleted,
    removeFromReservations,
    moveToReading,
    updateReservationStatus,
    handleReserve,
    handleStartReading,
    handlePickUp,
    navigateToBrowse,
  };
}
