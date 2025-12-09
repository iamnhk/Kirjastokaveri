import { useCallback, useState } from 'react';
import { searchApi } from '../services/apiClient';
import type { SearchRecord, SearchType } from '../services/apiClient';
import type { FinnaBook, FinnaSearchParams } from '../services/finnaApi';
import { mockSearchBooks, mockGetTrendingBooks } from '../services/mockData';

// Toggle this to switch between mock, direct Finna, and backend API
// 'mock' = use mock data, 'finna' = direct Finna API, 'backend' = use our backend
const DATA_SOURCE: 'mock' | 'finna' | 'backend' = 'backend';

// Convert backend SearchRecord to FinnaBook format for compatibility
function mapSearchRecordToFinnaBook(record: SearchRecord): FinnaBook {
  return {
    id: record.record_id,
    title: record.title || 'Untitled',
    author: record.authors.length > 0 ? record.authors[0] : 'Unknown Author',
    year: record.year || undefined,
    isbn: record.isbns,
    imageUrl: record.cover_url || undefined,
    buildings: record.buildings.map(b => ({
      building: b,
      location: '',
      available: 0,
      total: 0,
    })),
  };
}

interface UseFinnaSearchResult {
  books: FinnaBook[];
  isLoading: boolean;
  error: string | null;
  resultCount: number;
  search: (params: FinnaSearchParams) => Promise<void>;
  loadTrending: () => Promise<void>;
}

export function useFinnaSearch(): UseFinnaSearchResult {
  const [books, setBooks] = useState<FinnaBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

  const search = useCallback(async (params: FinnaSearchParams & { subject?: string[] }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (DATA_SOURCE === 'mock') {
        // Use mock data
        const mockResults = await mockSearchBooks(params.lookfor, params.limit);
        setBooks(mockResults);
        setResultCount(mockResults.length);
      } else if (DATA_SOURCE === 'backend') {
        // Use our backend API (which proxies to Finna)
        const result = await searchApi.search({
          query: params.lookfor,
          type: (params.type as SearchType) || 'AllFields',
          limit: params.limit || 20,
          subject: params.subject,
        });
        const mappedBooks = result.records.map(mapSearchRecordToFinnaBook);
        setBooks(mappedBooks);
        setResultCount(result.total_hits);
      } else {
        // Use direct Finna API (imported from finnaApi.ts)
        const { searchBooks } = await import('../services/finnaApi');
        const result = await searchBooks(params);
        setBooks(result.records);
        setResultCount(result.resultCount);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search books');
      setBooks([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (DATA_SOURCE === 'mock') {
        // Use mock data
        const trendingBooks = await mockGetTrendingBooks(20);
        setBooks(trendingBooks);
        setResultCount(trendingBooks.length);
      } else if (DATA_SOURCE === 'backend') {
        // Use our backend API - search for popular books
        const result = await searchApi.search({
          query: '*',
          type: 'AllFields',
          limit: 20,
        });
        const mappedBooks = result.records.map(mapSearchRecordToFinnaBook);
        setBooks(mappedBooks);
        setResultCount(result.total_hits);
      } else {
        // Use direct Finna API
        const { getTrendingBooks } = await import('../services/finnaApi');
        const trendingBooks = await getTrendingBooks(20);
        setBooks(trendingBooks);
        setResultCount(trendingBooks.length);
      }
    } catch (err) {
      console.error('Trending books error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trending books');
      setBooks([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    books,
    isLoading,
    error,
    resultCount,
    search,
    loadTrending
  };
}
