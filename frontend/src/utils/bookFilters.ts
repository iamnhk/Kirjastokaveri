import { useMemo } from 'react';
import type { FinnaBook } from '../services/finnaApi';
import { GENRE_MAP } from '../components/browse/useBrowseController';

export type AvailabilityFilter = 'All' | 'Available' | 'Not Available';

interface FilterParams {
  books: FinnaBook[];
  selectedGenre: string;
  selectedAvailability: AvailabilityFilter;
}

export function useFilteredBooks({ books, selectedGenre, selectedAvailability }: FilterParams) {
  return useMemo(() => {
    return books.filter(book => {
      // Get Finnish search terms for the selected genre
      const finnishTerms = GENRE_MAP[selectedGenre] || [];
      const genreMatch =
        selectedGenre === 'All' ||
        finnishTerms.length === 0 ||
        book.subjects?.some(subject => 
          finnishTerms.some(term => subject.toLowerCase().includes(term.toLowerCase()))
        );

      if (!genreMatch) {
        return false;
      }

      const totalAvailable = (book.buildings ?? []).reduce((sum, building) => sum + (building.available ?? 0), 0);

      switch (selectedAvailability) {
        case 'Available':
          return totalAvailable > 0;
        case 'Not Available':
          return totalAvailable === 0;
        default:
          return true;
      }
    });
  }, [books, selectedGenre, selectedAvailability]);
}
