import { useMemo } from 'react';
import type { FinnaBook } from '../services/finnaApi';
import { GENRE_MAP } from './genreMap';

export type AvailabilityFilter = 'All' | 'Available' | 'Not Available';

interface FilterParams {
  books: FinnaBook[];
  selectedGenre: string;
  selectedAvailability: AvailabilityFilter;
}

export function useFilteredBooks({ books, selectedGenre, selectedAvailability }: FilterParams) {
  return useMemo(() => {
    return books.filter(book => {
      // Get search terms for the selected genre
      const genreTerms = GENRE_MAP[selectedGenre] || [];
      
      // Check if genre matches - search in subjects AND title for better matching
      const genreMatch =
        selectedGenre === 'All' ||
        genreTerms.length === 0 ||
        book.subjects?.some(subject => 
          genreTerms.some(term => subject.toLowerCase().includes(term.toLowerCase()))
        ) ||
        genreTerms.some(term => book.title?.toLowerCase().includes(term.toLowerCase()));

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
