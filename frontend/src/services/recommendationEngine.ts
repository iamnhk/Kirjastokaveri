import type { FinnaBook } from './finnaApi';

export interface RecommendationScore {
  book: FinnaBook;
  score: number;
  reasons: string[];
  category: 'trending' | 'personalized' | 'similar' | 'new_release';
}

export interface UserProfile {
  favoriteGenres: Map<string, number>;
  favoriteAuthors: Map<string, number>;
  readBooks: Set<string>;
  savedBooks: Set<string>;
  recentInteractions: string[];
}

/**
 * Advanced recommendation engine for Kirjastokaveri
 * Analyzes user behavior and book metadata to provide personalized suggestions
 */
export class RecommendationEngine {
  private userProfile: UserProfile;

  constructor() {
    this.userProfile = {
      favoriteGenres: new Map(),
      favoriteAuthors: new Map(),
      readBooks: new Set(),
      savedBooks: new Set(),
      recentInteractions: [],
    };
  }

  /**
   * Update user profile based on their reading lists
   */
  updateProfile(readingList: any[], wishlist: any[], completedList: any[]) {
    // Clear and rebuild profile
    this.userProfile.favoriteGenres.clear();
    this.userProfile.favoriteAuthors.clear();
    this.userProfile.readBooks.clear();
    this.userProfile.savedBooks.clear();

    // Process all lists
    const allBooks = [...readingList, ...wishlist, ...completedList];
    
    allBooks.forEach(book => {
      // Track authors
      if (book.author) {
        const count = this.userProfile.favoriteAuthors.get(book.author) || 0;
        this.userProfile.favoriteAuthors.set(book.author, count + 1);
      }

      // Track genres
      if (book.genre) {
        const count = this.userProfile.favoriteGenres.get(book.genre) || 0;
        this.userProfile.favoriteGenres.set(book.genre, count + 1);
      }

      // Track saved books
      this.userProfile.savedBooks.add(String(book.id));
    });

    // Mark completed books as read
    completedList.forEach(book => {
      this.userProfile.readBooks.add(String(book.id));
    });
  }

  /**
   * Calculate personalized recommendation score for a book
   */
  private calculatePersonalizedScore(book: FinnaBook): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Skip if already saved
    if (this.userProfile.savedBooks.has(book.id)) {
      return { score: -1000, reasons: ['Already in your lists'] };
    }

    // Check author match (high weight)
    if (book.author) {
      for (const [author, count] of this.userProfile.favoriteAuthors.entries()) {
        if (book.author.toLowerCase().includes(author.toLowerCase()) ||
            author.toLowerCase().includes(book.author.toLowerCase())) {
          score += 50 * count;
          reasons.push(`By ${book.author}, one of your favorite authors`);
          break;
        }
      }
    }

    // Check genre/subject match
    if (book.subjects && book.subjects.length > 0) {
      for (const subject of book.subjects) {
        for (const [genre, count] of this.userProfile.favoriteGenres.entries()) {
          if (subject.toLowerCase().includes(genre.toLowerCase()) ||
              genre.toLowerCase().includes(subject.toLowerCase())) {
            score += 30 * count;
            reasons.push(`Matches your interest in ${subject}`);
            break;
          }
        }
      }
    }

    // Boost for availability
    const availableCount = book.buildings?.reduce((sum, b) => sum + (b.available || 0), 0) || 0;
    if (availableCount > 0) {
      score += Math.min(availableCount * 3, 20);
      reasons.push(`${availableCount} ${availableCount === 1 ? 'copy' : 'copies'} available now`);
    }

    // Boost for recent books
    if (book.year) {
      const currentYear = new Date().getFullYear();
      const bookYear = parseInt(book.year);
      if (!isNaN(bookYear) && currentYear - bookYear <= 2) {
        score += 15;
        reasons.push('Recent release');
      }
    }

    return { score, reasons };
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(books: FinnaBook[], limit: number = 12): RecommendationScore[] {
    const recommendations: RecommendationScore[] = [];

    for (const book of books) {
      const { score, reasons } = this.calculatePersonalizedScore(book);
      
      if (score > 20) {
        recommendations.push({
          book,
          score,
          reasons,
          category: 'personalized',
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending books based on availability and demand
   */
  getTrendingBooks(books: FinnaBook[], limit: number = 12): RecommendationScore[] {
    const recommendations: RecommendationScore[] = [];

    for (const book of books) {
      // Skip if already saved
      if (this.userProfile.savedBooks.has(book.id)) continue;

      const totalCopies = book.buildings?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;
      const availableCount = book.buildings?.reduce((sum, b) => sum + (b.available || 0), 0) || 0;
      const reserved = totalCopies - availableCount;

      // High demand = many copies but low availability
      const demandScore = totalCopies * 3 + reserved * 5;
      
      if (totalCopies > 3) {
        const reasons: string[] = [];
        
        if (availableCount > 0) {
          reasons.push(`High demand - ${availableCount} available`);
        } else if (reserved > 5) {
          reasons.push('Very popular - high waitlist');
        } else {
          reasons.push('Popular in libraries');
        }

        recommendations.push({
          book,
          score: demandScore,
          reasons,
          category: 'trending',
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find similar books based on a target book
   */
  findSimilarBooks(targetBook: FinnaBook, allBooks: FinnaBook[], limit: number = 6): RecommendationScore[] {
    const recommendations: RecommendationScore[] = [];

    for (const book of allBooks) {
      if (book.id === targetBook.id) continue;
      if (this.userProfile.savedBooks.has(book.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      // Same author (highest priority)
      if (book.author && targetBook.author &&
          book.author.toLowerCase() === targetBook.author.toLowerCase()) {
        score += 60;
        reasons.push(`Also by ${book.author}`);
      }

      // Shared subjects
      if (book.subjects && targetBook.subjects) {
        const commonSubjects = book.subjects.filter(s => 
          targetBook.subjects?.some(ts => 
            s.toLowerCase() === ts.toLowerCase()
          )
        );
        
        if (commonSubjects.length > 0) {
          score += commonSubjects.length * 20;
          reasons.push(`Similar theme: ${commonSubjects[0]}`);
        }
      }

      // Similar publication year
      if (book.year && targetBook.year) {
        const yearDiff = Math.abs(parseInt(book.year) - parseInt(targetBook.year));
        if (yearDiff <= 3) {
          score += 10;
        }
      }

      if (score > 20) {
        recommendations.push({
          book,
          score,
          reasons,
          category: 'similar',
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get new releases (books from last 2 years)
   */
  getNewReleases(books: FinnaBook[], limit: number = 12): RecommendationScore[] {
    const currentYear = new Date().getFullYear();
    const recommendations: RecommendationScore[] = [];

    for (const book of books) {
      if (this.userProfile.savedBooks.has(book.id)) continue;

      if (book.year) {
        const bookYear = parseInt(book.year);
        if (!isNaN(bookYear) && currentYear - bookYear <= 1) {
          const availableCount = book.buildings?.reduce((sum, b) => sum + (b.available || 0), 0) || 0;
          
          recommendations.push({
            book,
            score: (currentYear - bookYear === 0 ? 100 : 50) + availableCount * 5,
            reasons: [`Published in ${book.year}`, availableCount > 0 ? 'Available now' : 'New release'],
            category: 'new_release',
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine();
