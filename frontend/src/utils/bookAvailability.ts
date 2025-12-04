import type { FinnaBook } from '../services/finnaApi';

export type AvailabilityStatus = 'Available Now' | 'Limited' | 'Not Available';

export function getTotalAvailableCopies(book: FinnaBook): number {
  if (!book.buildings || book.buildings.length === 0) {
    return 0;
  }

  return book.buildings.reduce((sum, building) => sum + (building.available ?? 0), 0);
}

export function getAvailabilityStatus(totalAvailable: number): AvailabilityStatus {
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
    default:
      return 'bg-slate-400';
  }
}
