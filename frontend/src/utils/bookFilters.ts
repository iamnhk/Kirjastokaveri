import { useMemo } from 'react';
import type { FinnaBook } from '../services/finnaApi';

export type AvailabilityFilter = 'All' | 'Available Now' | 'Limited' | 'Not Available';

interface FilterParams {
  books: FinnaBook[];
  selectedGenre: string;
  selectedAvailability: AvailabilityFilter;
}

export function useFilteredBooks({ books, selectedGenre, selectedAvailability }: FilterParams) {
  return useMemo(() => {
    return books.filter(book => {
      const genreMatch =
        selectedGenre === 'All' ||
        book.subjects?.some(subject => subject.toLowerCase().includes(selectedGenre.toLowerCase()));

      if (!genreMatch) {
        return false;
      }

      const totalAvailable = (book.buildings ?? []).reduce((sum, building) => sum + (building.available ?? 0), 0);

      switch (selectedAvailability) {
        case 'Available Now':
          return totalAvailable > 5;
        case 'Limited':
          return totalAvailable > 0 && totalAvailable <= 5;
        case 'Not Available':
          return totalAvailable === 0;
        default:
          return true;
      }
    });
  }, [books, selectedGenre, selectedAvailability]);
}
