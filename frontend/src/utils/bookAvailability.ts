import type { FinnaBook } from '../services/finnaApi';

export type AvailabilityStatus = 'Available Now' | 'Limited' | 'Not Available' | 'Unknown';

export function getTotalAvailableCopies(book: FinnaBook): number {
  if (!book.buildings || book.buildings.length === 0) {
    return -1; // -1 indicates unknown (no data)
  }

  // Check if we have actual availability data (not just building names)
  const hasAvailabilityData = book.buildings.some(b => b.available !== undefined && b.available > 0 || b.total !== undefined && b.total > 0);
  
  if (!hasAvailabilityData) {
    return -1; // We only have building names, not availability counts
  }

  return book.buildings.reduce((sum, building) => sum + (building.available ?? 0), 0);
}

export function getAvailabilityStatus(totalAvailable: number): AvailabilityStatus {
  if (totalAvailable === -1) {
    return 'Unknown'; // No availability data
  }
  
  if (totalAvailable > 5) {
    return 'Available Now';
  }

  if (totalAvailable > 0) {
    return 'Limited';
  }

  return 'Not Available';
}

export function getAvailabilityColorClass(status: AvailabilityStatus): string {
  switch (status) {
    case 'Available Now':
      return 'bg-cyan-400';
    case 'Limited':
      return 'bg-yellow-400';
    case 'Unknown':
      return 'bg-blue-400'; // Blue for "check availability"
    default:
      return 'bg-slate-400';
  }
}
