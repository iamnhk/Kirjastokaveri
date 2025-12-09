// Genre mapping: English labels for UI, terms for Finna API filtering
// First 3 terms are used in the search query, so put most relevant ones first
// Includes both Finnish and English terms as Finna subjects can be in either language
export const GENRE_MAP: Record<string, string[]> = {
  'All': [],
  'Fiction': ['fiction', 'romaanit', 'kaunokirjallisuus', 'novel'],
  'Fantasy': ['fantasy', 'fantasia'],
  'Mystery': ['mystery', 'dekkarit', 'thriller', 'jännitys', 'detective'],
  'Romance': ['romance', 'rakkaus', 'romantiikka'],
  'Sci-Fi': ['science fiction', 'scifi', 'tieteiskirjallisuus'],
  'Biography': ['biography', 'elämäkerrat', 'biographies'],
  'History': ['history', 'historia'],
  'Programming': ['programming', 'ohjelmointi', 'software', 'ohjelmistokehitys', 'coding'],
  'Technology': ['technology', 'tietotekniikka', 'computer', 'teknologia', 'tietokone'],
  'Web Dev': ['web', 'html', 'javascript', 'web development', 'frontend', 'backend'],
  'AI & ML': ['machine learning', 'artificial intelligence', 'tekoäly', 'koneoppiminen', 'deep learning', 'neural'],
  'Data Science': ['data science', 'data', 'statistics', 'data-analyysi', 'analytics', 'big data'],
};

export const GENRES = Object.keys(GENRE_MAP);
