/**
 * Availability Monitor Service
 * Monitors tracked libraries for book availability and triggers notifications
 */

import { getAvailability } from './finnaApi';
import type { BuildingInfo } from './finnaApi';
import { mockGetAvailability } from './mockData';
import type { WishlistBook } from '../contexts/BooksContext';

// Toggle this to switch between mock and real API
// Set to false to use real Finna API for availability checks
const USE_MOCK_DATA = false;

export interface AvailabilityStatus {
  bookId: number | string;
  library: string;
  previousAvailable: number;
  currentAvailable: number;
  timestamp: string;
}

/**
 * Check availability for a single book at tracked libraries
 */
export async function checkBookAvailability(
  book: WishlistBook,
  finnaId?: string
): Promise<AvailabilityStatus[]> {
  // If book doesn't have tracked libraries, skip
  if (!book.trackedLibraries || book.trackedLibraries.length === 0) {
    return [];
  }

  // If we don't have a Finna ID, we can't check availability
  if (!finnaId) {
    return [];
  }

  try {
    // Get current availability from API (mock or real)
    const buildings = USE_MOCK_DATA 
      ? await mockGetAvailability(finnaId)
      : await getAvailability(finnaId);
    
    // Get stored availability status
    const storedStatuses = getStoredAvailability(book.id);
    const changes: AvailabilityStatus[] = [];

    // Check each tracked library
    for (const trackedLibrary of book.trackedLibraries) {
      const buildingInfo = buildings.find(b => b.building === trackedLibrary);
      const previousStatus = storedStatuses[trackedLibrary];

      if (buildingInfo) {
        const currentAvailable = buildingInfo.available;
        const previousAvailable = previousStatus?.available || 0;

        // If availability changed (especially if it became available)
        if (currentAvailable !== previousAvailable) {
          changes.push({
            bookId: book.id,
            library: trackedLibrary,
            previousAvailable,
            currentAvailable,
            timestamp: new Date().toISOString(),
          });

          // Update stored status
          updateStoredAvailability(book.id, trackedLibrary, currentAvailable);
        }
      }
    }

    return changes;
  } catch (error) {
    console.error(`Error checking availability for book ${book.id}:`, error);
    return [];
  }
}

/**
 * Check availability for all books in wishlist
 */
export async function checkAllWishlistAvailability(
  wishlist: WishlistBook[]
): Promise<Map<number | string, AvailabilityStatus[]>> {
  const results = new Map<number | string, AvailabilityStatus[]>();

  // Process books sequentially to avoid rate limiting
  for (const book of wishlist) {
    // Only check books with tracked libraries
    if (book.trackedLibraries && book.trackedLibraries.length > 0) {
      // Prefer explicit Finna identifier when available
      const finnaId = book.finnaId ?? String(book.id);
      
      try {
        const changes = await checkBookAvailability(book, finnaId);
        if (changes.length > 0) {
          results.set(book.id, changes);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error checking book ${book.id}:`, error);
      }
    }
  }

  return results;
}

/**
 * Get stored availability status from localStorage
 */
function getStoredAvailability(bookId: number | string): Record<string, { available: number; timestamp: string }> {
  const key = `kirjastokaveri_availability_${bookId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  
  return {};
}

/**
 * Update stored availability status in localStorage
 */
function updateStoredAvailability(
  bookId: number | string,
  library: string,
  available: number
): void {
  const key = `kirjastokaveri_availability_${bookId}`;
  const stored = getStoredAvailability(bookId);
  
  stored[library] = {
    available,
    timestamp: new Date().toISOString(),
  };
  
  localStorage.setItem(key, JSON.stringify(stored));
}

/**
 * Initialize availability tracking for a book
 * Should be called when a book is added to wishlist with tracked libraries
 */
export async function initializeAvailabilityTracking(
  book: WishlistBook,
  finnaId: string
): Promise<void> {
  if (!book.trackedLibraries || book.trackedLibraries.length === 0) {
    return;
  }

  try {
    const buildings = book.buildings && book.buildings.length > 0
      ? book.buildings
      : USE_MOCK_DATA
        ? await mockGetAvailability(finnaId)
        : await getAvailability(finnaId);
    
    // Store initial availability for each tracked library
    for (const trackedLibrary of book.trackedLibraries) {
      const buildingInfo = buildings.find(b => b.building === trackedLibrary);
      if (buildingInfo) {
        updateStoredAvailability(book.id, trackedLibrary, buildingInfo.available);
      }
    }
  } catch (error) {
    console.error(`Error initializing availability tracking for book ${book.id}:`, error);
  }
}

/**
 * Clear availability tracking for a book
 * Should be called when a book is removed from wishlist
 */
export function clearAvailabilityTracking(bookId: number | string): void {
  const key = `kirjastokaveri_availability_${bookId}`;
  localStorage.removeItem(key);
}

/**
 * Determine if a change is worth notifying about
 */
export function shouldNotify(change: AvailabilityStatus): boolean {
  // Notify if book became available (was 0, now > 0)
  if (change.previousAvailable === 0 && change.currentAvailable > 0) {
    return true;
  }
  
  // Notify if more copies became available (increase of 3 or more)
  if (change.currentAvailable > change.previousAvailable && 
      change.currentAvailable - change.previousAvailable >= 3) {
    return true;
  }
  
  return false;
}

/**
 * Get a human-readable notification message
 */
export function getNotificationMessage(
  book: WishlistBook,
  change: AvailabilityStatus
): string {
  if (change.previousAvailable === 0 && change.currentAvailable > 0) {
    return `"${book.title}" is now available at ${change.library}! ${change.currentAvailable} ${change.currentAvailable === 1 ? 'copy' : 'copies'} available.`;
  }
  
  if (change.currentAvailable > change.previousAvailable) {
    return `More copies of "${book.title}" available at ${change.library}! ${change.currentAvailable} ${change.currentAvailable === 1 ? 'copy' : 'copies'} now available.`;
  }
  
  return `Availability update for "${book.title}" at ${change.library}: ${change.currentAvailable} ${change.currentAvailable === 1 ? 'copy' : 'copies'} available.`;
}
