import type { FinnaBook } from '../services/finnaApi';
import type { Book } from '../contexts/BooksContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400';

const isBook = (book: unknown): book is Book => {
  return typeof book === 'object' && book !== null && 'image' in (book as Record<string, unknown>);
};

export const isFinnaBook = (book: unknown): book is FinnaBook => {
  return typeof book === 'object' && book !== null && 'imageUrl' in (book as Record<string, unknown>);
};

const getAvailabilityLabel = (book: FinnaBook): string => {
  const totalAvailable = book.buildings?.reduce((sum, building) => {
    return sum + (building.available || 0);
  }, 0) ?? 0;

  if (totalAvailable > 5) {
    return 'Available Now';
  }

  if (totalAvailable > 0) {
    return 'Limited';
  }

  return 'Not Available';
};

export const mapFinnaBookToBook = (book: FinnaBook): Book => {
  return {
    id: book.id,
    finnaId: book.id,
    image: book.imageUrl ?? FALLBACK_IMAGE,
    title: book.title,
    author: book.author ?? 'Unknown Author',
    genre: book.subjects?.[0],
    availability: getAvailabilityLabel(book),
    buildings: book.buildings,
  };
};

export const ensureBookShape = (book: Book | FinnaBook): Book => {
  if (isBook(book)) {
    const image = book.image || ('imageUrl' in book && typeof book.imageUrl === 'string' ? book.imageUrl : undefined);

    return {
      ...book,
      image: image ?? FALLBACK_IMAGE,
    };
  }

  return mapFinnaBookToBook(book);
};

export const mergeFinnaMeta = (book: Book, source: Book | FinnaBook): Book => {
  if (!isFinnaBook(source)) {
    return book;
  }

  return {
    ...book,
    finnaId: book.finnaId ?? source.id,
    buildings: source.buildings ?? book.buildings,
  };
};
