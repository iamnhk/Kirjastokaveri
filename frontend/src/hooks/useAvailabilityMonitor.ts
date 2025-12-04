/**
 * Hook for monitoring book availability at tracked libraries
 */

import { useEffect, useCallback, useRef } from 'react';
import { useBooks } from '../contexts/BooksContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  checkAllWishlistAvailability,
  shouldNotify,
  getNotificationMessage,
} from '../services/availabilityMonitor';
import type { AvailabilityStatus } from '../services/availabilityMonitor';

interface UseAvailabilityMonitorOptions {
  enabled?: boolean;
  checkInterval?: number; // in milliseconds
}

/**
 * Hook to monitor wishlist books for availability changes
 * Automatically checks tracked libraries and sends notifications
 */
export function useAvailabilityMonitor(options: UseAvailabilityMonitorOptions = {}) {
  const {
    enabled = true,
    checkInterval = 5 * 60 * 1000, // Default: 5 minutes
  } = options;

  const { wishlist } = useBooks();
  const { addNotification, preferences } = useNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  /**
   * Check all wishlist books for availability changes
   */
  const checkAvailability = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      return;
    }

    // Don't check if notifications are disabled
    if (!preferences.bookAvailable) {
      return;
    }

    // Only check if we have books with tracked libraries
    const booksToCheck = wishlist.filter(
      book => book.trackedLibraries && book.trackedLibraries.length > 0
    );

    if (booksToCheck.length === 0) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const results = await checkAllWishlistAvailability(booksToCheck);

      // Process changes and send notifications
      results.forEach((changes, bookId) => {
        const book = wishlist.find(b => b.id === bookId);
        if (!book) return;

        changes.forEach(change => {
          // Only notify for significant changes
          if (shouldNotify(change)) {
            const message = getNotificationMessage(book, change);
            
            addNotification({
              id: `${bookId}_${change.library}_${Date.now()}`,
              type: 'bookAvailable',
              message,
              bookId: String(bookId),
              bookTitle: book.title,
              bookAuthor: book.author,
              bookImageUrl: book.image,
              timestamp: new Date().toISOString(),
              isRead: false,
              metadata: {
                library: change.library,
                available: change.currentAvailable,
                previousAvailable: change.previousAvailable,
              },
            });
          }
        });
      });
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [wishlist, addNotification, preferences.bookAvailable]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Do an initial check
    checkAvailability();

    // Set up periodic checking
    intervalRef.current = setInterval(checkAvailability, checkInterval);
  }, [checkAvailability, checkInterval]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Manual check trigger
   */
  const checkNow = useCallback(async () => {
    await checkAvailability();
  }, [checkAvailability]);

  // Auto-start/stop monitoring based on enabled flag
  useEffect(() => {
    if (enabled && wishlist.length > 0) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enabled, wishlist.length, startMonitoring, stopMonitoring]);

  return {
    checkNow,
    startMonitoring,
    stopMonitoring,
    isChecking: isCheckingRef.current,
  };
}
