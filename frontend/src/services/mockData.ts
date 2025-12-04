/**
 * Mock Data Service
 * Provides comprehensive mock data for testing without real API calls
 */

import type { FinnaBook, BuildingInfo } from './finnaApi';

// Mock library buildings with realistic Finnish library data
export const mockBuildings: BuildingInfo[] = [
  { building: 'Helsinki Central Library Oodi', location: 'Töölönlahdenkatu 4, Helsinki', available: 3, total: 5, callnumber: '84.2 HAI', distance: 0.8 },
  { building: 'Rikhardinkatu Library', location: 'Rikhardinkatu 3, Helsinki', available: 1, total: 3, callnumber: '84.2 HAI', distance: 1.2 },
  { building: 'Kallio Library', location: 'Viides linja 11, Helsinki', available: 0, total: 2, callnumber: '84.2 HAI', distance: 2.5 },
  { building: 'Pasila Library', location: 'Kellosilta 9, Helsinki', available: 2, total: 4, callnumber: '84.2 HAI', distance: 3.1 },
  { building: 'Espoo Main Library', location: 'Karhusaarentie 3, Espoo', available: 4, total: 6, callnumber: '84.2 HAI', distance: 8.5 },
  { building: 'Tapiola Library', location: 'Ahertajantie 5, Espoo', available: 0, total: 2, callnumber: '84.2 HAI', distance: 9.2 },
  { building: 'Vantaa City Library', location: 'Kielotie 13, Vantaa', available: 1, total: 3, callnumber: '84.2 HAI', distance: 12.4 },
  { building: 'Tampere City Library Metso', location: 'Pirkankatu 2, Tampere', available: 2, total: 4, callnumber: '84.2 HAI', distance: 165.3 },
  { building: 'Turku City Library', location: 'Linnankatu 2, Turku', available: 0, total: 1, callnumber: '84.2 HAI', distance: 158.7 },
  { building: 'Oulu City Library', location: 'Kaarlenväylä 3, Oulu', available: 1, total: 2, callnumber: '84.2 HAI', distance: 554.2 },
];

// Comprehensive mock book data
export const mockBooks: FinnaBook[] = [
  {
    id: 'finna.1001',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    year: '2020',
    publisher: 'Canongate Books',
    language: ['English'],
    subjects: ['Fiction', 'Fantasy', 'Philosophy', 'Mental Health'],
    summary: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices.',
    isbn: ['978-1786892737'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1002',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    year: '2021',
    publisher: 'Del Rey Books',
    language: ['English'],
    subjects: ['Science Fiction', 'Space', 'Adventure'],
    summary: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.',
    isbn: ['978-0593135204'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 4) })),
  },
  {
    id: 'finna.1003',
    title: 'Kalevala',
    author: 'Elias Lönnrot',
    year: '1849',
    publisher: 'Suomalaisen Kirjallisuuden Seura',
    language: ['Finnish'],
    subjects: ['Finnish Literature', 'Epic Poetry', 'Mythology', 'Folklore'],
    summary: 'The Finnish national epic, a compilation of Finnish folk poetry and mythology.',
    isbn: ['978-9517175708'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 6) })),
  },
  {
    id: 'finna.1004',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    year: '2017',
    publisher: 'Atria Books',
    language: ['English'],
    subjects: ['Fiction', 'Romance', 'Historical Fiction', 'LGBTQ+'],
    summary: 'Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.',
    isbn: ['978-1501139239'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 3) })),
  },
  {
    id: 'finna.1005',
    title: 'Atomic Habits',
    author: 'James Clear',
    year: '2018',
    publisher: 'Avery',
    language: ['English'],
    subjects: ['Self-Help', 'Psychology', 'Personal Development'],
    summary: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.',
    isbn: ['978-0735211292'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 7) })),
  },
  {
    id: 'finna.1006',
    title: 'Educated',
    author: 'Tara Westover',
    year: '2018',
    publisher: 'Random House',
    language: ['English'],
    subjects: ['Biography', 'Memoir', 'Education'],
    summary: 'A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
    isbn: ['978-0399590504'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 4) })),
  },
  {
    id: 'finna.1007',
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    year: '2018',
    publisher: 'G.P. Putnam\'s Sons',
    language: ['English'],
    subjects: ['Fiction', 'Mystery', 'Romance', 'Coming of Age'],
    summary: 'For years, rumors of the "Marsh Girl" have haunted Barkley Cove, a quiet town on the North Carolina coast.',
    isbn: ['978-0735219090'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1008',
    title: 'Tuntematon sotilas',
    author: 'Väinö Linna',
    year: '1954',
    publisher: 'WSOY',
    language: ['Finnish'],
    subjects: ['Finnish Literature', 'War', 'Historical Fiction'],
    summary: 'The Unknown Soldier - A classic Finnish war novel depicting the Continuation War from the perspective of ordinary Finnish soldiers.',
    isbn: ['978-9510414439'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1633856364580-97698963b68b?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 6) })),
  },
  {
    id: 'finna.1009',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    year: '2011',
    publisher: 'Harper',
    language: ['English'],
    subjects: ['History', 'Anthropology', 'Science', 'Philosophy'],
    summary: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution.',
    isbn: ['978-0062316097'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1010',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    year: '2019',
    publisher: 'Celadon Books',
    language: ['English'],
    subjects: ['Thriller', 'Mystery', 'Psychological Fiction'],
    summary: 'Alicia Berenson\'s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house. One evening her husband returns home late, and she shoots him five times. Then she never speaks again.',
    isbn: ['978-1250301697'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 4) })),
  },
  {
    id: 'finna.1011',
    title: 'Becoming',
    author: 'Michelle Obama',
    year: '2018',
    publisher: 'Crown Publishing',
    language: ['English'],
    subjects: ['Biography', 'Memoir', 'Politics'],
    summary: 'In her memoir, a work of deep reflection and mesmerizing storytelling, Michelle Obama invites readers into her world.',
    isbn: ['978-1524763138'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 6) })),
  },
  {
    id: 'finna.1012',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    year: '1988',
    publisher: 'HarperOne',
    language: ['English', 'Portuguese'],
    subjects: ['Fiction', 'Philosophy', 'Adventure', 'Spirituality'],
    summary: 'A magical fable about following your dreams and listening to your heart.',
    isbn: ['978-0062315007'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1013',
    title: 'Seitsemän veljestä',
    author: 'Aleksis Kivi',
    year: '1870',
    publisher: 'Suomalaisen Kirjallisuuden Seura',
    language: ['Finnish'],
    subjects: ['Finnish Literature', 'Classic Literature', 'Coming of Age'],
    summary: 'Seven Brothers - The first significant novel written in Finnish, telling the story of seven orphaned brothers.',
    isbn: ['978-9517175715'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 4) })),
  },
  {
    id: 'finna.1014',
    title: '1984',
    author: 'George Orwell',
    year: '1949',
    publisher: 'Secker & Warburg',
    language: ['English'],
    subjects: ['Fiction', 'Dystopian', 'Political Fiction', 'Science Fiction'],
    summary: 'A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism.',
    isbn: ['978-0452284234'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 7) })),
  },
  {
    id: 'finna.1015',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    year: '1937',
    publisher: 'George Allen & Unwin',
    language: ['English'],
    subjects: ['Fantasy', 'Adventure', 'Classic Literature'],
    summary: 'Bilbo Baggins is swept into a quest to reclaim the lost Dwarf Kingdom of Erebor from the fearsome dragon Smaug.',
    isbn: ['978-0547928227'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1633856364580-97698963b68b?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1016',
    title: 'Harry Potter and the Philosopher\'s Stone',
    author: 'J.K. Rowling',
    year: '1997',
    publisher: 'Bloomsbury',
    language: ['English'],
    subjects: ['Fantasy', 'Young Adult', 'Magic', 'Adventure'],
    summary: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.',
    isbn: ['978-0439708180'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1741158672093-38fe55d84071?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 8) })),
  },
  {
    id: 'finna.1017',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: '1925',
    publisher: 'Charles Scribner\'s Sons',
    language: ['English'],
    subjects: ['Fiction', 'Classic Literature', 'Romance'],
    summary: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    isbn: ['978-0743273565'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1760578302642-e5e8990698db?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 6) })),
  },
  {
    id: 'finna.1018',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    year: '1960',
    publisher: 'J.B. Lippincott & Co.',
    language: ['English'],
    subjects: ['Fiction', 'Classic Literature', 'Social Issues'],
    summary: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
    isbn: ['978-0061120084'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 5) })),
  },
  {
    id: 'finna.1019',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    publisher: 'T. Egerton',
    language: ['English'],
    subjects: ['Fiction', 'Romance', 'Classic Literature'],
    summary: 'A romantic novel of manners that follows the character development of Elizabeth Bennet.',
    isbn: ['978-0141439518'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 4) })),
  },
  {
    id: 'finna.1020',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    year: '1951',
    publisher: 'Little, Brown and Company',
    language: ['English'],
    subjects: ['Fiction', 'Coming of Age', 'Classic Literature'],
    summary: 'The story of Holden Caulfield\'s experiences in New York City in the days following his expulsion from prep school.',
    isbn: ['978-0316769174'],
    formats: ['Book'],
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    buildings: mockBuildings.map(b => ({ ...b, available: Math.floor(Math.random() * 3) })),
  },
];

/**
 * Mock search function that simulates API delay and filters books
 */
export async function mockSearchBooks(query: string, limit: number = 20): Promise<FinnaBook[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerQuery = query.toLowerCase();
  
  // Filter books by title, author, or subjects
  const filtered = mockBooks.filter(book => 
    book.title.toLowerCase().includes(lowerQuery) ||
    book.author.toLowerCase().includes(lowerQuery) ||
    book.subjects?.some(s => s.toLowerCase().includes(lowerQuery))
  );
  
  return filtered.slice(0, limit);
}

/**
 * Mock trending books function
 */
export async function mockGetTrendingBooks(limit: number = 20): Promise<FinnaBook[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return shuffled books to simulate trending
  const shuffled = [...mockBooks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/**
 * Mock availability check function
 */
export async function mockGetAvailability(bookId: string): Promise<BuildingInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const book = mockBooks.find(b => b.id === bookId);
  return book?.buildings || [];
}