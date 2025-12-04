/**
 * Hook for syncing wishlist with backend API
 * When user is authenticated, syncs wishlist to/from server
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { wishlistApi, type WishlistItem, type WishlistItemCreate } from '../services/apiClient';
import type { WishlistBook, Book } from '../contexts/BooksContext';

interface UseWishlistSyncOptions {
  localWishlist: WishlistBook[];
  setWishlist: React.Dispatch<React.SetStateAction<WishlistBook[]>>;
  onSyncComplete?: () => void;
}

/**
 * Convert backend WishlistItem to frontend WishlistBook format
 */
function apiToWishlistBook(item: WishlistItem): WishlistBook {
  return {
    id: item.finna_id, // Use finna_id as the book ID
    finnaId: item.finna_id,
    title: item.title,
    author: item.author || 'Unknown Author',
    year: item.year || undefined,
    image: item.cover_image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    availability: item.is_available ? 'Available' : 'Not Available',
    trackedLibraries: item.preferred_library_name ? [item.preferred_library_name] : [],
    // Store the database ID for updates/deletes
    dbId: item.id,
  } as WishlistBook & { dbId: number };
}

/**
 * Convert frontend WishlistBook to backend WishlistItemCreate format
 */
function wishlistBookToApi(book: WishlistBook | Book): WishlistItemCreate {
  return {
    finna_id: book.finnaId || String(book.id),
    title: book.title,
    author: book.author,
    year: typeof book.year === 'string' ? book.year : undefined,
    cover_image: book.image,
    notify_on_available: true, // Enable notifications by default
    preferred_library_name: 'trackedLibraries' in book && book.trackedLibraries?.[0] 
      ? book.trackedLibraries[0] 
      : undefined,
  };
}

/**
 * Hook to sync wishlist between localStorage and backend API
 */
export function useWishlistSync({
  localWishlist,
  setWishlist,
  onSyncComplete,
}: UseWishlistSyncOptions) {
  const { isAuthenticated, user } = useAuth();
  const isSyncing = useRef(false);
  const lastSyncedUserId = useRef<number | null>(null);

  /**
   * Fetch wishlist from backend and merge with local
   */
  const syncFromBackend = useCallback(async () => {
    if (!isAuthenticated || isSyncing.current) return;

    isSyncing.current = true;
    try {
      const backendItems = await wishlistApi.getAll();
      const backendBooks = backendItems.map(apiToWishlistBook);

      // Merge strategy: Backend is source of truth for authenticated users
      // But keep local items that aren't on backend yet
      const backendFinnaIds = new Set(backendItems.map(item => item.finna_id));
      
      // Find local items not yet on backend
      const localOnlyItems = localWishlist.filter(
        book => !backendFinnaIds.has(book.finnaId || String(book.id))
      );

      // Upload local-only items to backend
      for (const localItem of localOnlyItems) {
        try {
          await wishlistApi.add(wishlistBookToApi(localItem));
        } catch (error) {
          console.error('Failed to sync local item to backend:', error);
        }
      }

      // Refresh from backend after uploading local items
      const updatedBackendItems = await wishlistApi.getAll();
      const updatedBackendBooks = updatedBackendItems.map(apiToWishlistBook);

      setWishlist(updatedBackendBooks);
      onSyncComplete?.();
    } catch (error) {
      console.error('Failed to sync wishlist from backend:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [isAuthenticated, localWishlist, setWishlist, onSyncComplete]);

  /**
   * Add book to backend wishlist
   */
  const addToBackend = useCallback(async (book: Book | WishlistBook): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      await wishlistApi.add(wishlistBookToApi(book));
      return true;
    } catch (error: any) {
      // 409 = already exists, which is fine
      if (error?.status === 409) return true;
      console.error('Failed to add to backend wishlist:', error);
      return false;
    }
  }, [isAuthenticated]);

  /**
   * Remove book from backend wishlist
   */
  const removeFromBackend = useCallback(async (book: WishlistBook): Promise<boolean> => {
    if (!isAuthenticated) return false;

    const dbId = (book as WishlistBook & { dbId?: number }).dbId;
    if (!dbId) {
      // Try to find the item by finna_id
      try {
        const items = await wishlistApi.getAll();
        const item = items.find(i => i.finna_id === (book.finnaId || String(book.id)));
        if (item) {
          await wishlistApi.remove(item.id);
          return true;
        }
      } catch (error) {
        console.error('Failed to find item to remove:', error);
      }
      return false;
    }

    try {
      await wishlistApi.remove(dbId);
      return true;
    } catch (error) {
      console.error('Failed to remove from backend wishlist:', error);
      return false;
    }
  }, [isAuthenticated]);

  /**
   * Update notification preference for a wishlist item
   */
  const updateNotificationPreference = useCallback(async (
    book: WishlistBook,
    notifyOnAvailable: boolean
  ): Promise<boolean> => {
    if (!isAuthenticated) return false;

    const dbId = (book as WishlistBook & { dbId?: number }).dbId;
    if (!dbId) return false;

    try {
      await wishlistApi.update(dbId, { notify_on_available: notifyOnAvailable });
      return true;
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Sync when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id && user.id !== lastSyncedUserId.current) {
      lastSyncedUserId.current = user.id;
      syncFromBackend();
    } else if (!isAuthenticated) {
      lastSyncedUserId.current = null;
    }
  }, [isAuthenticated, user?.id, syncFromBackend]);

  return {
    syncFromBackend,
    addToBackend,
    removeFromBackend,
    updateNotificationPreference,
    isSyncing: isSyncing.current,
  };
}
