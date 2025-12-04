/**
 * Finna API Service
 * 
 * Finna is the search service for Finnish libraries, archives and museums.
 * API Documentation: https://www.kiwi.fi/display/Finna/Finna+REST+API
 * 
 * For availability data, we use our backend which scrapes detailed
 * availability information from Finna's AJAX endpoints.
 * 
 * Base URL: https://api.finna.fi/v1/
 */

const FINNA_API_BASE = 'https://api.finna.fi/v1';
const BACKEND_API_BASE = '/api'; // Proxied to backend via Vite config

export interface FinnaBook {
  id: string;
  title: string;
  author: string;
  year?: string;
  publisher?: string;
  language?: string[];
  subjects?: string[];
  summary?: string;
  isbn?: string[];
  formats?: string[];
  imageUrl?: string;
  buildings?: BuildingInfo[];
}

export interface BuildingInfo {
  building: string;
  location: string;
  available: number;
  total: number;
  callnumber?: string;
  distance?: number; // Distance in kilometers from user
  status?: string; // Availability status (e.g., "Available", "On Loan")
  url?: string; // Direct Finna URL for this location
}

export interface FinnaSearchParams {
  lookfor: string;
  type?: 'AllFields' | 'Title' | 'Author' | 'Subject' | 'ISBN';
  field?: string[];
  filter?: string[];
  limit?: number;
  page?: number;
  sort?: 'relevance' | 'year' | 'author' | 'title';
}

export interface FinnaSearchResponse {
  resultCount: number;
  records: FinnaBook[];
  facets?: any;
}

/**
 * Search for books in Finna
 */
export async function searchBooks(params: FinnaSearchParams): Promise<FinnaSearchResponse> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('lookfor', params.lookfor);
    queryParams.append('type', params.type || 'AllFields');
    queryParams.append('limit', String(params.limit || 20));
    queryParams.append('page', String(params.page || 1));
    
    // Add format filter for books only
    queryParams.append('filter[]', '~format:"0/Book/"');
    
    // Add additional filters
    if (params.filter) {
      params.filter.forEach(filter => queryParams.append('filter[]', filter));
    }
    
    // Add fields to return
    const fields = [
      'id',
      'title',
      'authors',
      'year',
      'publisher',
      'languages',
      'subjects',
      'summary',
      'isbn',
      'formats',
      'images',
      'buildings'
    ];
    fields.forEach(field => queryParams.append('field[]', field));

    const response = await fetch(`${FINNA_API_BASE}/search?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Finna API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      resultCount: data.resultCount || 0,
      records: data.records?.map(transformFinnaRecord) || [],
      facets: data.facets
    };
  } catch (error) {
    console.error('Error fetching from Finna API:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific book
 */
export async function getBookDetails(id: string): Promise<FinnaBook | null> {
  try {
    const response = await fetch(`${FINNA_API_BASE}/record?id=${encodeURIComponent(id)}`);
    
    if (!response.ok) {
      throw new Error(`Finna API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      return transformFinnaRecord(data.records[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching book details from Finna:', error);
    throw error;
  }
}

/**
 * Get availability information for a specific book at libraries.
 * Uses the backend API which scrapes detailed availability from Finna.
 * 
 * @param id - Finna record ID
 * @param latitude - Optional user latitude for distance calculation
 * @param longitude - Optional user longitude for distance calculation
 */
export async function getAvailability(
  id: string, 
  latitude?: number, 
  longitude?: number
): Promise<BuildingInfo[]> {
  try {
    // Build URL with optional location params
    let url = `${BACKEND_API_BASE}/search/availability/${encodeURIComponent(id)}`;
    const params = new URLSearchParams();
    if (latitude !== undefined) params.append('latitude', String(latitude));
    if (longitude !== undefined) params.append('longitude', String(longitude));
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      // Fallback to direct Finna API if backend unavailable
      console.warn('Backend unavailable, falling back to Finna API');
      return getAvailabilityFromFinna(id);
    }

    const data = await response.json();
    
    // Transform backend response to BuildingInfo format
    // Backend now returns available_count and total_count directly
    if (data.items && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        building: item.library || 'Unknown',
        location: item.call_number || item.location || '',
        available: item.available_count ?? (item.status?.toLowerCase() === 'available' ? 1 : 0),
        total: item.total_count ?? 1,
        callnumber: item.call_number || item.location || undefined,
        distance: item.distance_km,
        status: item.status,
        url: item.url
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching availability:', error);
    // Fallback to direct Finna API
    return getAvailabilityFromFinna(id);
  }
}

/**
 * Fallback: Get availability directly from Finna REST API
 * (Less detailed than scraped data)
 */
async function getAvailabilityFromFinna(id: string): Promise<BuildingInfo[]> {
  try {
    const response = await fetch(`${FINNA_API_BASE}/record?id=${encodeURIComponent(id)}&field[]=buildings`);
    
    if (!response.ok) {
      throw new Error(`Finna API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      return transformBuildings(data.records[0].buildings);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching availability from Finna:', error);
    return [];
  }
}

/**
 * Transform Finna API record to our internal format
 */
function transformFinnaRecord(record: any): FinnaBook {
  // Extract primary author
  const primaryAuthor = record.authors?.primary?.[0] || 
                        record.nonPresenterAuthors?.[0]?.name || 
                        'Unknown Author';

  // Get best quality image URL
  const imageUrl = record.images?.[0] 
    ? `https://api.finna.fi${record.images[0]}`
    : undefined;

  // Transform buildings/availability data
  const buildings = transformBuildings(record.buildings);

  return {
    id: record.id,
    title: record.title || 'Untitled',
    author: primaryAuthor,
    year: record.year,
    publisher: record.publisher?.[0],
    language: record.languages || [],
    subjects: record.subjects?.[0] || [],
    summary: record.summary?.[0],
    isbn: record.isbn || [],
    formats: record.formats || [],
    imageUrl,
    buildings
  };
}

/**
 * Transform building/availability information
 */
function transformBuildings(buildings: any): BuildingInfo[] {
  if (!buildings || !Array.isArray(buildings)) {
    return [];
  }

  return buildings.map((building: any) => ({
    building: building.translated || building.building || 'Unknown',
    location: building.location || '',
    available: building.available || 0,
    total: building.total || 0,
    callnumber: building.callnumber
  }));
}

/**
 * Get the Finna URL for reserving a book
 */
export function getFinnaReservationUrl(bookId: string): string {
  // Remove API prefix from ID if present
  const cleanId = bookId.replace('finna.', '');
  return `https://finna.fi/Record/${encodeURIComponent(cleanId)}`;
}

/**
 * Get popular/trending books (using a curated search)
 */
export async function getTrendingBooks(limit: number = 10): Promise<FinnaBook[]> {
  try {
    // Search for recently published popular fiction in Finnish
    const result = await searchBooks({
      lookfor: '*',
      type: 'AllFields',
      filter: [
        '~format:"0/Book/"',
        'language:"fin"',
        `publishDate:"[${new Date().getFullYear() - 2} TO ${new Date().getFullYear()}]"`
      ],
      sort: 'year',
      limit
    });
    
    return result.records;
  } catch (error) {
    console.error('Error fetching trending books:', error);
    return [];
  }
}

/**
 * Get book recommendations based on subjects
 */
export async function getRecommendations(subjects: string[], limit: number = 5): Promise<FinnaBook[]> {
  try {
    if (!subjects || subjects.length === 0) {
      return [];
    }

    // Use first subject as search term
    const result = await searchBooks({
      lookfor: subjects[0],
      type: 'Subject',
      limit
    });
    
    return result.records;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}