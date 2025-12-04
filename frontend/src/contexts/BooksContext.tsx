import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { BuildingInfo } from '../services/finnaApi';
import { booksApi, tokenService } from '../services/apiClient';

export type BookId = number | string;

export interface Book {
  id: BookId;
  image: string;
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  availability?: string;
  finnaId?: string;
  buildings?: BuildingInfo[];
}

export interface ReadingBook extends Book {
  progress: number;
  dueDate: string;
  dbId?: number; // Backend database ID
}

export interface WishlistBook extends Book {
  availability: string;
  trackedLibraries?: string[]; // Array of library names to track
  dbId?: number; // Database ID for backend sync
  notifyOnAvailable?: boolean; // Whether to notify when available
}

export interface CompletedBook extends Book {
  completedDate: string;
  rating: number;
  dbId?: number; // Backend database ID
}

export interface ReservedBook extends Book {
  reservedDate: string;
  status: 'reserved' | 'picked-up' | 'cancelled' | 'confirmed' | 'ready' | 'returned';
  library?: string;
  libraryId?: string;
  expectedDate?: string;
  dueDate?: string;
  dbId?: number; // Backend database ID
  queuePosition?: number;
}

interface BooksContextType {
  readingList: ReadingBook[];
  wishlist: WishlistBook[];
  completedList: CompletedBook[];
  reservations: ReservedBook[];
  addToReading: (book: Book) => void;
  addToReadingWithDueDate: (book: Book, dueDate: string) => void;
  addToWishlist: (book: Book, trackedLibraries?: string[]) => void;
  addToCompleted: (book: Book, rating: number) => void;
  addToReservations: (book: Book, library?: string, libraryId?: string) => void;
  removeFromReading: (bookId: BookId) => void;
  removeFromWishlist: (bookId: BookId) => void;
  removeFromCompleted: (bookId: BookId) => void;
  removeFromReservations: (bookId: BookId) => void;
  updateReservationStatus: (bookId: BookId, status: ReservedBook['status'], dueDate?: string) => void;
  updateReadingProgress: (bookId: BookId, progress: number) => void;
  moveReservationToReading: (bookId: BookId) => void;
  isInReading: (bookId: BookId) => boolean;
  isInWishlist: (bookId: BookId) => boolean;
  isInCompleted: (bookId: BookId) => boolean;
  isInReservations: (bookId: BookId) => boolean;
  moveToCompleted: (bookId: BookId, rating: number) => void;
  moveToReading: (bookId: BookId) => void;
  updateWishlistLibraries: (bookId: BookId, trackedLibraries: string[]) => void;
  toggleNotifyOnAvailable: (bookId: BookId, enabled: boolean) => Promise<void>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or use initial data
  const [readingList, setReadingList] = useState<ReadingBook[]>(() => {
    const saved = localStorage.getItem('kirjastokaveri_reading');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
        title: 'The Midnight Library',
        author: 'Matt Haig',
        progress: 45,
        dueDate: '2025-02-15'
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        progress: 72,
        dueDate: '2025-02-20'
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
        title: 'Atomic Habits',
        author: 'James Clear',
        progress: 28,
        dueDate: '2025-02-25'
      }
    ];
  });

  const [wishlist, setWishlist] = useState<WishlistBook[]>(() => {
    const saved = localStorage.getItem('kirjastokaveri_wishlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 4,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        title: 'The Seven Husbands of Evelyn Hugo',
        author: 'Taylor Jenkins Reid',
        availability: 'Available Now',
        trackedLibraries: ['Helsinki Central Library Oodi', 'Espoo Main Library']
      },
      {
        id: 5,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        title: 'Educated',
        author: 'Tara Westover',
        availability: 'Limited',
        trackedLibraries: ['Tampere City Library Metso', 'Turku City Library', 'Oulu City Library']
      },
      {
        id: 6,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
        title: 'Where the Crawdads Sing',
        author: 'Delia Owens',
        availability: 'Available Now',
        trackedLibraries: ['Vantaa City Library']
      },
      {
        id: 7,
        image: 'https://images.unsplash.com/photo-1633856364580-97698963b68b?w=400',
        title: 'Tuntematon sotilas',
        author: 'Väinö Linna',
        availability: 'Available Now',
        trackedLibraries: ['Helsinki Central Library Oodi', 'Kallio Library']
      },
      {
        id: 8,
        image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
        title: 'Kalevala',
        author: 'Elias Lönnrot',
        availability: 'Limited',
        trackedLibraries: ['Rikhardinkatu Library']
      }
    ];
  });

  const [completedList, setCompletedList] = useState<CompletedBook[]>(() => {
    const saved = localStorage.getItem('kirjastokaveri_completed');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 9,
        image: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        completedDate: '2025-01-15',
        rating: 5
      },
      {
        id: 10,
        image: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        completedDate: '2025-01-10',
        rating: 4
      },
      {
        id: 11,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        title: 'Becoming',
        author: 'Michelle Obama',
        completedDate: '2024-12-28',
        rating: 5
      },
      {
        id: 12,
        image: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        completedDate: '2024-12-15',
        rating: 4
      }
    ];
  });

  const [reservations, setReservations] = useState<ReservedBook[]>(() => {
    const saved = localStorage.getItem('kirjastokaveri_reservations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 13,
        image: 'https://images.unsplash.com/photo-1633856364580-97698963b68b?w=400',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        reservedDate: '2025-01-20',
        status: 'reserved',
        library: 'Helsinki Central Library Oodi',
        expectedDate: '2025-02-05'
      },
      {
        id: 14,
        image: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        reservedDate: '2025-01-18',
        status: 'picked-up',
        library: 'Espoo Main Library',
        dueDate: '2025-02-15'
      },
      {
        id: 15,
        image: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
        title: '1984',
        author: 'George Orwell',
        reservedDate: '2025-01-22',
        status: 'reserved',
        library: 'Kallio Library',
        expectedDate: '2025-02-08'
      }
    ];
  });

  // Save to localStorage whenever lists change
  useEffect(() => {
    localStorage.setItem('kirjastokaveri_reading', JSON.stringify(readingList));
  }, [readingList]);

  useEffect(() => {
    localStorage.setItem('kirjastokaveri_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('kirjastokaveri_completed', JSON.stringify(completedList));
  }, [completedList]);

  useEffect(() => {
    localStorage.setItem('kirjastokaveri_reservations', JSON.stringify(reservations));
  }, [reservations]);

  // Sync wishlist from backend when user is authenticated
  const syncWishlistFromBackend = useCallback(async () => {
    if (!tokenService.hasTokens()) return;
    
    try {
      const backendItems = await booksApi.getByList('wishlist');
      
      // Convert backend items to WishlistBook format
      const backendBooks: WishlistBook[] = backendItems.map(item => ({
        id: item.finna_id,
        finnaId: item.finna_id,
        title: item.title,
        author: item.author || 'Unknown Author',
        image: item.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        availability: item.availability_data?.is_available ? 'Available' : 'Not Available',
        // Use tracked_libraries array from backend, fallback to library_name for legacy data
        trackedLibraries: item.tracked_libraries || (item.library_name ? [item.library_name] : []),
        dbId: item.id,
        notifyOnAvailable: item.notify_on_available ?? true,
      }));

      // Merge: Backend is source of truth, but upload any local-only items
      const backendFinnaIds = new Set(backendItems.map(item => item.finna_id));
      const localOnlyItems = wishlist.filter(
        book => !backendFinnaIds.has(book.finnaId || String(book.id))
      );

      // Upload local-only items to backend
      for (const localItem of localOnlyItems) {
        try {
          const response = await booksApi.add({
            finna_id: localItem.finnaId || String(localItem.id),
            title: localItem.title,
            author: localItem.author,
            cover_image: localItem.image,
            list_type: 'wishlist',
            notify_on_available: true,
            // Save all tracked libraries to backend
            tracked_libraries: localItem.trackedLibraries,
            library_name: localItem.trackedLibraries?.[0],
          });
          // Add to backend books with dbId
          backendBooks.push({
            ...localItem,
            dbId: response.id,
          });
        } catch (error: any) {
          // 409 = already exists
          if (error?.status !== 409) {
            console.error('Failed to sync local wishlist item to backend:', error);
          }
        }
      }

      setWishlist(backendBooks);
    } catch (error) {
      console.error('Failed to sync wishlist from backend:', error);
    }
  }, [wishlist]);

  // Sync reservations from backend when user is authenticated
  const syncReservationsFromBackend = useCallback(async () => {
    if (!tokenService.hasTokens()) return;
    
    try {
      const backendReservations = await booksApi.getByList('reserved');
      
      // Convert backend reservations to ReservedBook format
      const backendBooks: ReservedBook[] = backendReservations.map(r => ({
        id: r.finna_id,
        finnaId: r.finna_id,
        title: r.title,
        author: r.author || 'Unknown Author',
        image: r.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        reservedDate: r.created_at.split('T')[0],
        status: r.status as ReservedBook['status'] || 'reserved',
        library: r.library_name,
        libraryId: r.library_id,
        expectedDate: r.due_date || undefined,
        dueDate: r.due_date || undefined,
        dbId: r.id,
        queuePosition: r.queue_position || undefined,
      }));

      // Merge: Backend is source of truth, but upload any local-only items
      const backendFinnaIds = new Set(backendReservations.map(r => r.finna_id));
      const localOnlyItems = reservations.filter(
        book => !backendFinnaIds.has(book.finnaId || String(book.id)) && !book.dbId
      );

      // Upload local-only items to backend
      for (const localItem of localOnlyItems) {
        if (!localItem.library || !localItem.libraryId) continue; // Skip items without library info
        
        try {
          const response = await booksApi.add({
            finna_id: localItem.finnaId || String(localItem.id),
            title: localItem.title,
            author: localItem.author,
            cover_image: localItem.image,
            list_type: 'reserved',
            library_id: localItem.libraryId,
            library_name: localItem.library,
            status: 'reserved',
          });
          backendBooks.push({
            ...localItem,
            dbId: response.id,
          });
        } catch (error: any) {
          if (error?.status !== 409) {
            console.error('Failed to sync local reservation to backend:', error);
          }
        }
      }

      setReservations(backendBooks);
    } catch (error) {
      console.error('Failed to sync reservations from backend:', error);
    }
  }, [reservations]);

  // Sync reading list from backend when user is authenticated
  const syncReadingFromBackend = useCallback(async () => {
    if (!tokenService.hasTokens()) return;
    
    try {
      const backendItems = await booksApi.getByList('reading');
      
      // Convert backend items to ReadingBook format
      const backendBooks: ReadingBook[] = backendItems.map(item => ({
        id: item.finna_id || item.id,
        finnaId: item.finna_id || undefined,
        title: item.title,
        author: item.author || 'Unknown Author',
        image: item.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        progress: item.progress ?? 0,
        dueDate: item.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dbId: item.id,
      } as ReadingBook & { dbId: number }));

      // Merge: Backend is source of truth, but upload any local-only items
      const backendFinnaIds = new Set(backendItems.map(item => item.finna_id || String(item.id)));
      const localOnlyItems = readingList.filter(
        book => !backendFinnaIds.has(book.finnaId || String(book.id)) && !(book as any).dbId
      );

      // Upload local-only items to backend
      for (const localItem of localOnlyItems) {
        try {
          const response = await booksApi.add({
            finna_id: localItem.finnaId || String(localItem.id),
            title: localItem.title,
            author: localItem.author,
            cover_image: localItem.image,
            list_type: 'reading',
            progress: localItem.progress,
            due_date: localItem.dueDate,
            start_date: new Date().toISOString().split('T')[0],
          });
          backendBooks.push({
            ...localItem,
            dbId: response.id,
          } as ReadingBook & { dbId: number });
        } catch (error: any) {
          if (error?.status !== 409) {
            console.error('Failed to sync local reading item to backend:', error);
          }
        }
      }

      setReadingList(backendBooks);
    } catch (error) {
      console.error('Failed to sync reading list from backend:', error);
    }
  }, [readingList]);

  // Sync completed list from backend when user is authenticated
  const syncCompletedFromBackend = useCallback(async () => {
    if (!tokenService.hasTokens()) return;
    
    try {
      const backendItems = await booksApi.getByList('completed');
      
      // Convert backend items to CompletedBook format
      const backendBooks: CompletedBook[] = backendItems.map(item => ({
        id: item.finna_id || item.id,
        finnaId: item.finna_id || undefined,
        title: item.title,
        author: item.author || 'Unknown Author',
        image: item.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        completedDate: item.completed_date || item.created_at.split('T')[0],
        rating: item.rating || 0,
        dbId: item.id,
      } as CompletedBook & { dbId: number }));

      // Merge: Backend is source of truth, but upload any local-only items
      const backendFinnaIds = new Set(backendItems.map(item => item.finna_id || String(item.id)));
      const localOnlyItems = completedList.filter(
        book => !backendFinnaIds.has(book.finnaId || String(book.id)) && !(book as any).dbId
      );

      // Upload local-only items to backend
      for (const localItem of localOnlyItems) {
        try {
          const response = await booksApi.add({
            finna_id: localItem.finnaId || String(localItem.id),
            title: localItem.title,
            author: localItem.author,
            cover_image: localItem.image,
            list_type: 'completed',
            completed_date: localItem.completedDate,
            rating: localItem.rating,
          });
          backendBooks.push({
            ...localItem,
            dbId: response.id,
          } as CompletedBook & { dbId: number });
        } catch (error: any) {
          if (error?.status !== 409) {
            console.error('Failed to sync local completed item to backend:', error);
          }
        }
      }

      setCompletedList(backendBooks);
    } catch (error) {
      console.error('Failed to sync completed list from backend:', error);
    }
  }, [completedList]);

  // Initial sync when component mounts (if authenticated)
  useEffect(() => {
    if (tokenService.hasTokens()) {
      syncWishlistFromBackend();
      syncReservationsFromBackend();
      syncReadingFromBackend();
      syncCompletedFromBackend();
    }
  }, []); // Run once on mount

  const addToReading = async (book: Book) => {
    if (isInReading(book.id)) {
      toast.info('This book is already in your reading list');
      return;
    }

    // Calculate due date (2 weeks from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const newBook: ReadingBook & { dbId?: number } = {
      ...book,
      progress: 0,
      dueDate: dueDateStr
    };

    // Add to local state immediately
    setReadingList(prev => [...prev, newBook]);
    toast.success(`"${book.title}" added to Currently Reading`);

    // Sync to backend if authenticated
    if (tokenService.hasTokens()) {
      try {
        const response = await booksApi.add({
          finna_id: book.finnaId || String(book.id),
          title: book.title,
          author: book.author,
          cover_image: book.image,
          list_type: 'reading',
          progress: 0,
          due_date: dueDateStr,
          start_date: new Date().toISOString().split('T')[0],
        });
        
        // Update local state with backend ID
        setReadingList(prev => prev.map(b => 
          (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
            ? { ...b, dbId: response.id } as ReadingBook & { dbId: number }
            : b
        ));
      } catch (error: any) {
        if (error?.status !== 409) {
          console.error('Failed to sync reading item to backend:', error);
        }
      }
    }
  };

  const addToReadingWithDueDate = async (book: Book, dueDate: string) => {
    if (isInReading(book.id)) {
      toast.info('This book is already in your reading list');
      return;
    }

    const newBook: ReadingBook & { dbId?: number } = {
      ...book,
      progress: 0,
      dueDate
    };

    // Add to local state immediately
    setReadingList(prev => [...prev, newBook]);
    toast.success(`"${book.title}" added to Currently Reading`);

    // Sync to backend if authenticated
    if (tokenService.hasTokens()) {
      try {
        const response = await booksApi.add({
          finna_id: book.finnaId || String(book.id),
          title: book.title,
          author: book.author,
          cover_image: book.image,
          list_type: 'reading',
          progress: 0,
          due_date: dueDate,
          start_date: new Date().toISOString().split('T')[0],
        });
        
        // Update local state with backend ID
        setReadingList(prev => prev.map(b => 
          (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
            ? { ...b, dbId: response.id } as ReadingBook & { dbId: number }
            : b
        ));
      } catch (error: any) {
        if (error?.status !== 409) {
          console.error('Failed to sync reading item to backend:', error);
        }
      }
    }
  };

  const addToWishlist = async (book: Book, trackedLibraries?: string[]) => {
    if (isInWishlist(book.id)) {
      toast.info('This book is already in your wishlist');
      return;
    }

    const newBook: WishlistBook = {
      ...book,
      availability: book.availability || 'Available Now',
      notifyOnAvailable: true,
      ...(trackedLibraries && { trackedLibraries })
    };

    // Add to local state immediately
    setWishlist(prev => [...prev, newBook]);
    toast.success(`"${book.title}" added to Wishlist`);

    // Sync to backend if authenticated
    if (tokenService.hasTokens()) {
      try {
        const response = await booksApi.add({
          finna_id: book.finnaId || String(book.id),
          title: book.title,
          author: book.author,
          cover_image: book.image,
          list_type: 'wishlist',
          notify_on_available: true,
          // Save all tracked libraries to backend
          tracked_libraries: trackedLibraries,
          library_name: trackedLibraries?.[0],
        });
        
        // Update local state with backend ID
        setWishlist(prev => prev.map(b => 
          (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
            ? { ...b, dbId: response.id }
            : b
        ));
      } catch (error: any) {
        // 409 = already exists, which is fine
        if (error?.status !== 409) {
          console.error('Failed to sync wishlist to backend:', error);
        }
      }
    }
  };

  const addToCompleted = async (book: Book, rating: number) => {
    if (isInCompleted(book.id)) {
      toast.info('This book is already in your completed list');
      return;
    }

    const completedDate = new Date().toISOString().split('T')[0];
    const newBook: CompletedBook & { dbId?: number } = {
      ...book,
      completedDate,
      rating
    };

    // Add to local state immediately
    setCompletedList(prev => [...prev, newBook]);
    toast.success(`"${book.title}" marked as completed`);

    // Sync to backend if authenticated
    if (tokenService.hasTokens()) {
      try {
        const response = await booksApi.add({
          finna_id: book.finnaId || String(book.id),
          title: book.title,
          author: book.author,
          cover_image: book.image,
          list_type: 'completed',
          completed_date: completedDate,
          rating,
        });
        
        // Update local state with backend ID
        setCompletedList(prev => prev.map(b => 
          (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
            ? { ...b, dbId: response.id } as CompletedBook & { dbId: number }
            : b
        ));
      } catch (error: any) {
        if (error?.status !== 409) {
          console.error('Failed to sync completed item to backend:', error);
        }
      }
    }
  };

  const addToReservations = async (book: Book, library?: string, libraryId?: string) => {
    if (isInReservations(book.id)) {
      toast.info('This book is already reserved');
      return;
    }

    const newBook: ReservedBook = {
      ...book,
      reservedDate: new Date().toISOString().split('T')[0],
      status: 'reserved',
      library,
      libraryId,
    };

    // Add to local state immediately
    setReservations(prev => [...prev, newBook]);
    toast.success(`"${book.title}" reserved`);

    // Sync to backend if authenticated
    if (tokenService.hasTokens()) {
      try {
        const response = await booksApi.add({
          finna_id: book.finnaId || String(book.id),
          title: book.title,
          author: book.author,
          cover_image: book.image,
          list_type: 'reserved',
          library_id: libraryId || library || 'unknown',
          library_name: library || 'Unknown Library',
          status: 'reserved',
        });
        
        // Update local state with backend ID
        setReservations(prev => prev.map(r => 
          (r.finnaId || String(r.id)) === (book.finnaId || String(book.id))
            ? { ...r, dbId: response.id }
            : r
        ));
      } catch (error: any) {
        if (error?.status !== 409) {
          console.error('Failed to sync reservation to backend:', error);
        }
      }
    }
  };

  const removeFromReading = async (bookId: BookId) => {
    const book = readingList.find(b => b.id === bookId) as (ReadingBook & { dbId?: number }) | undefined;
    
    // Remove from local state immediately
    setReadingList(readingList.filter(b => b.id !== bookId));
    
    if (book) {
      toast.success(`"${book.title}" removed from reading list`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens()) {
        try {
          if (book.dbId) {
            await booksApi.remove(book.dbId);
          } else {
            // Otherwise, find the item by finna_id
            const items = await booksApi.getByList('reading');
            const item = items.find(i => i.finna_id === (book.finnaId || String(book.id)));
            if (item) {
              await booksApi.remove(item.id);
            }
          }
        } catch (error) {
          console.error('Failed to remove from backend reading list:', error);
        }
      }
    }
  };

  const removeFromWishlist = async (bookId: BookId) => {
    const book = wishlist.find(b => b.id === bookId);
    
    // Remove from local state immediately
    setWishlist(wishlist.filter(b => b.id !== bookId));
    
    if (book) {
      toast.success(`"${book.title}" removed from wishlist`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens()) {
        try {
          // If we have the dbId, use it directly
          if (book.dbId) {
            await booksApi.remove(book.dbId);
          } else {
            // Otherwise, find the item by finna_id
            const items = await booksApi.getByList('wishlist');
            const item = items.find(i => i.finna_id === (book.finnaId || String(book.id)));
            if (item) {
              await booksApi.remove(item.id);
            }
          }
        } catch (error) {
          console.error('Failed to remove from backend wishlist:', error);
        }
      }
    }
  };

  const removeFromCompleted = async (bookId: BookId) => {
    const book = completedList.find(b => b.id === bookId) as (CompletedBook & { dbId?: number }) | undefined;
    
    // Remove from local state immediately
    setCompletedList(completedList.filter(b => b.id !== bookId));
    
    if (book) {
      toast.success(`"${book.title}" removed from completed list`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens()) {
        try {
          if (book.dbId) {
            await booksApi.remove(book.dbId);
          } else {
            // Otherwise, find the item by finna_id
            const items = await booksApi.getByList('completed');
            const item = items.find(i => i.finna_id === (book.finnaId || String(book.id)));
            if (item) {
              await booksApi.remove(item.id);
            }
          }
        } catch (error) {
          console.error('Failed to remove from backend completed list:', error);
        }
      }
    }
  };

  const removeFromReservations = async (bookId: BookId) => {
    const book = reservations.find(b => b.id === bookId);
    
    // Remove from local state immediately
    setReservations(reservations.filter(b => b.id !== bookId));
    
    if (book) {
      toast.success(`"${book.title}" removed from reservations`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens() && book.dbId) {
        try {
          await booksApi.remove(book.dbId);
        } catch (error) {
          console.error('Failed to cancel reservation in backend:', error);
        }
      }
    }
  };

  const updateReservationStatus = async (bookId: BookId, status: ReservedBook['status'], dueDate?: string) => {
    const book = reservations.find(b => b.id === bookId);
    if (book) {
      const updatedBook: ReservedBook = {
        ...book,
        status,
        ...(dueDate && { dueDate })
      };
      
      // Update local state immediately
      setReservations(reservations.map(b => (b.id === bookId ? updatedBook : b)));
      toast.success(`"${book.title}" status updated to ${status}`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens() && book.dbId) {
        try {
          await booksApi.update(book.dbId, {
            status,
            ...(dueDate && { due_date: dueDate }),
          });
        } catch (error) {
          console.error('Failed to update reservation status in backend:', error);
        }
      }
    }
  };

  const updateReadingProgress = async (bookId: BookId, progress: number) => {
    const book = readingList.find(b => b.id === bookId) as (ReadingBook & { dbId?: number }) | undefined;
    if (book) {
      const updatedBook = {
        ...book,
        progress
      };
      setReadingList(readingList.map(b => (b.id === bookId ? updatedBook : b)));
      toast.success(`"${book.title}" progress updated to ${progress}%`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens() && book.dbId) {
        try {
          await booksApi.update(book.dbId, { progress });
        } catch (error) {
          console.error('Failed to update reading progress in backend:', error);
        }
      }
    }
  };

  const moveReservationToReading = async (bookId: BookId) => {
    const book = reservations.find(b => b.id === bookId);
    if (book) {
      // Calculate due date (2 weeks from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      // Update local state immediately
      const readingBook: ReadingBook & { dbId?: number } = {
        ...book,
        progress: 0,
        dueDate: dueDateStr
      };
      
      setReservations(reservations.filter(b => b.id !== bookId));
      setReadingList(prev => [...prev, readingBook]);
      toast.success(`"${book.title}" moved to Currently Reading`);
      
      // Sync to backend - use move for efficiency (UPDATE instead of DELETE+INSERT)
      if (tokenService.hasTokens() && book.dbId) {
        try {
          const response = await booksApi.move(book.dbId, 'reading', {
            progress: 0,
            due_date: dueDateStr,
            start_date: new Date().toISOString().split('T')[0],
          });
          // Update the dbId in readingList
          setReadingList(prev => prev.map(b => 
            (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
              ? { ...b, dbId: response.id } as ReadingBook & { dbId: number }
              : b
          ));
        } catch (error) {
          console.error('Failed to move reservation to reading in backend:', error);
        }
      }
    }
  };

  const isInReading = (bookId: BookId) => {
    return readingList.some(b => b.id === bookId);
  };

  const isInWishlist = (bookId: BookId) => {
    return wishlist.some(b => b.id === bookId);
  };

  const isInCompleted = (bookId: BookId) => {
    return completedList.some(b => b.id === bookId);
  };

  const isInReservations = (bookId: BookId) => {
    return reservations.some(b => b.id === bookId);
  };

  const moveToCompleted = async (bookId: BookId, rating: number) => {
    const book = readingList.find(b => b.id === bookId) as (ReadingBook & { dbId?: number }) | undefined;
    if (book) {
      // Update local state immediately
      const completedDate = new Date().toISOString().split('T')[0];
      const completedBook: CompletedBook & { dbId?: number } = {
        ...book,
        completedDate,
        rating
      };
      
      setReadingList(readingList.filter(b => b.id !== bookId));
      setCompletedList(prev => [...prev, completedBook]);
      toast.success(`"${book.title}" moved to Completed`);
      
      // Sync to backend - use move for efficiency (UPDATE instead of DELETE+INSERT)
      if (tokenService.hasTokens() && book.dbId) {
        try {
          const response = await booksApi.move(book.dbId, 'completed', {
            completed_date: completedDate,
            rating,
          });
          // Update the dbId in completedList
          setCompletedList(prev => prev.map(b => 
            (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
              ? { ...b, dbId: response.id }
              : b
          ));
        } catch (error) {
          console.error('Failed to move to completed in backend:', error);
        }
      }
    }
  };

  const moveToReading = async (bookId: BookId) => {
    const book = wishlist.find(b => b.id === bookId);
    if (book) {
      // Calculate due date (2 weeks from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      // Update local state immediately
      const readingBook: ReadingBook & { dbId?: number } = {
        ...book,
        progress: 0,
        dueDate: dueDateStr
      };
      
      setWishlist(wishlist.filter(b => b.id !== bookId));
      setReadingList(prev => [...prev, readingBook]);
      toast.success(`"${book.title}" moved to Currently Reading`);
      
      // Sync to backend - use move for efficiency (UPDATE instead of DELETE+INSERT)
      if (tokenService.hasTokens() && book.dbId) {
        try {
          const response = await booksApi.move(book.dbId, 'reading', {
            progress: 0,
            due_date: dueDateStr,
            start_date: new Date().toISOString().split('T')[0],
          });
          // Update the dbId in readingList
          setReadingList(prev => prev.map(b => 
            (b.finnaId || String(b.id)) === (book.finnaId || String(book.id))
              ? { ...b, dbId: response.id } as ReadingBook & { dbId: number }
              : b
          ));
        } catch (error) {
          console.error('Failed to move to reading in backend:', error);
        }
      }
    }
  };

  const updateWishlistLibraries = async (bookId: BookId, trackedLibraries: string[]) => {
    const book = wishlist.find(b => b.id === bookId);
    if (book) {
      const updatedBook: WishlistBook = {
        ...book,
        trackedLibraries
      };
      
      // Update local state immediately
      setWishlist(wishlist.map(b => (b.id === bookId ? updatedBook : b)));
      toast.success(`"${book.title}" tracked libraries updated`);
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens() && book.dbId) {
        try {
          await booksApi.update(book.dbId, {
            // Save all tracked libraries to backend
            tracked_libraries: trackedLibraries,
            library_name: trackedLibraries[0] || undefined,
          });
        } catch (error) {
          console.error('Failed to update wishlist libraries in backend:', error);
        }
      }
    }
  };

  // Function to toggle notification preference for a wishlist item
  const toggleNotifyOnAvailable = async (bookId: BookId, notifyOnAvailable: boolean) => {
    const book = wishlist.find(b => b.id === bookId);
    if (book) {
      const updatedBook: WishlistBook = {
        ...book,
        notifyOnAvailable
      };
      
      // Update local state immediately
      setWishlist(wishlist.map(b => (b.id === bookId ? updatedBook : b)));
      
      // Sync to backend if authenticated
      if (tokenService.hasTokens() && book.dbId) {
        try {
          await booksApi.update(book.dbId, {
            notify_on_available: notifyOnAvailable,
          });
        } catch (error) {
          console.error('Failed to update notification preference in backend:', error);
        }
      }
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    readingList,
    wishlist,
    completedList,
    reservations,
    addToReading,
    addToReadingWithDueDate,
    addToWishlist,
    addToCompleted,
    addToReservations,
    removeFromReading,
    removeFromWishlist,
    removeFromCompleted,
    removeFromReservations,
    updateReservationStatus,
    updateReadingProgress,
    moveReservationToReading,
    isInReading,
    isInWishlist,
    isInCompleted,
    isInReservations,
    moveToCompleted,
    moveToReading,
    updateWishlistLibraries,
    toggleNotifyOnAvailable
  }), [
    readingList,
    wishlist,
    completedList,
    reservations,
    addToReading,
    addToReadingWithDueDate,
    addToWishlist,
    addToCompleted,
    addToReservations,
    removeFromReading,
    removeFromWishlist,
    removeFromCompleted,
    removeFromReservations,
    updateReservationStatus,
    updateReadingProgress,
    moveReservationToReading,
    isInReading,
    isInWishlist,
    isInCompleted,
    isInReservations,
    moveToCompleted,
    moveToReading,
    updateWishlistLibraries,
    toggleNotifyOnAvailable
  ]);

  return (
    <BooksContext.Provider value={contextValue}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}