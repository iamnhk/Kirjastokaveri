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
    checkInterval = 2 * 60 * 1000, // Default: 2 minutes
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
      
      let availableCount = 0;

      // Process changes and send notifications
      results.forEach((changes, bookId) => {
        const book = wishlist.find(b => b.id === bookId);
        if (!book) return;

        changes.forEach(change => {
          // Only notify for significant changes
          if (shouldNotify(change)) {
            availableCount++;
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
      
      // Send notification only when books become available
      if (availableCount > 0) {
        // Notifications are already added in the loop above
        console.log(`[AvailabilityMonitor] ${availableCount} book(s) now available`);
      } else {
        // Log silently - no notification for "still checking"
        console.log(`[AvailabilityMonitor] Checked ${booksToCheck.length} book(s), no availability changes`);
      }
    } catch (error) {
      console.error('[AvailabilityMonitor] Error checking availability:', error);
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

  /**
   * Send a test notification to demonstrate the notification system
   */
  const sendTestNotification = useCallback(() => {
    const testBook = wishlist.length > 0 ? wishlist[0] : null;
    const bookTitle = testBook?.title || 'Sample Book';
    const bookAuthor = testBook?.author || 'Test Author';
    const library = testBook?.trackedLibraries?.[0] || 'Helsinki Central Library';
    
    addNotification({
      id: `test_${Date.now()}`,
      type: 'bookAvailable',
      message: `"${bookTitle}" is now available at ${library}!`,
      bookId: testBook ? String(testBook.id) : 'test-book',
      bookTitle,
      bookAuthor,
      bookImageUrl: testBook?.image,
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata: {
        library,
        available: 2,
        previousAvailable: 0,
      },
    });
    
    toast.success(`🎉 Test notification sent!`, { duration: 2000 });
  }, [wishlist, addNotification]);

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
    sendTestNotification,
    startMonitoring,
    stopMonitoring,
    isChecking: isCheckingRef.current,
  };
}
