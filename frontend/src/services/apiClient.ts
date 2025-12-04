/**
 * API Client for Kirjastokaveri Backend
 * 
 * Provides typed API calls to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'kirjastokaveri_access_token';
const REFRESH_TOKEN_KEY = 'kirjastokaveri_refresh_token';

// Token management
export const tokenService = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasTokens: () => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

// Generic API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add auth header if token exists
  const accessToken = tokenService.getAccessToken();
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 - try to refresh token
  if (response.status === 401 && tokenService.getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${tokenService.getAccessToken()}`;
      const retryResponse = await fetch(url, { ...options, headers });
      if (!retryResponse.ok) {
        throw new ApiError(retryResponse.status, await retryResponse.text());
      }
      return retryResponse.json();
    }
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) return false;
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      tokenService.setTokens(data.access_token, data.refresh_token);
      return true;
    }
    
    // Refresh failed - clear tokens
    tokenService.clearTokens();
    return false;
  } catch {
    tokenService.clearTokens();
    return false;
  }
}

// Custom error class
export class ApiError extends Error {
  status: number;
  detail: string;
  
  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// ============ AUTH API ============

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthTokens> => {
    const response = await apiFetch<AuthTokens>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    tokenService.setTokens(response.access_token, response.refresh_token);
    return response;
  },
  
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const response = await apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    tokenService.setTokens(response.access_token, response.refresh_token);
    return response;
  },
  
  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      tokenService.clearTokens();
    }
  },
  
  getCurrentUser: async (): Promise<UserResponse> => {
    return apiFetch<UserResponse>('/auth/me');
  },
};

// ============ SEARCH API ============

export interface SearchRecord {
  record_id: string;
  title: string | null;
  authors: string[];
  year: string | null;
  cover_url: string | null;
  buildings: string[];
  isbns: string[];
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface SearchResponse {
  total_hits: number;
  records: SearchRecord[];
  facets: Record<string, FacetBucket[]>;
}

export interface AvailabilityItem {
  library: string;
  location: string | null;
  status: string;
  available_count: number;
  total_count: number;
  call_number: string | null;
  distance_km: number | null;
  url: string | null;
}

export interface AvailabilityResponse {
  record_id: string;
  total_available: number;
  total_copies: number;
  items: AvailabilityItem[];
}

export type SearchType = 'AllFields' | 'Author' | 'Subject' | 'Title';

export interface SearchParams {
  query: string;
  type?: SearchType;
  limit?: number;
  author?: string[];
  subject?: string[];
  format?: string[];
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.limit) queryParams.append('limit', String(params.limit));
    
    // Handle array params
    params.author?.forEach(a => queryParams.append('author', a));
    params.subject?.forEach(s => queryParams.append('subject', s));
    params.format?.forEach(f => queryParams.append('format', f));
    
    return apiFetch<SearchResponse>(`/search?${queryParams.toString()}`);
  },
  
  getAvailability: async (
    recordId: string,
    latitude?: number,
    longitude?: number
  ): Promise<AvailabilityResponse> => {
    const queryParams = new URLSearchParams();
    if (latitude !== undefined) queryParams.append('latitude', String(latitude));
    if (longitude !== undefined) queryParams.append('longitude', String(longitude));
    
    const queryString = queryParams.toString();
    const url = `/search/availability/${encodeURIComponent(recordId)}${queryString ? `?${queryString}` : ''}`;
    return apiFetch<AvailabilityResponse>(url);
  },
};

// ============ WISHLIST API ============

export interface WishlistItem {
  id: number;
  user_id: number;
  finna_id: string;
  title: string;
  author: string | null;
  year: string | null;
  isbn: string | null;
  cover_image: string | null;
  notify_on_available: boolean;
  preferred_library_id: string | null;
  preferred_library_name: string | null;
  last_availability_check: string | null;
  is_available: boolean;
  user_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface WishlistItemCreate {
  finna_id: string;
  title: string;
  author?: string;
  year?: string;
  isbn?: string;
  cover_image?: string;
  notify_on_available?: boolean;
  preferred_library_id?: string;
  preferred_library_name?: string;
  user_notes?: string;
}

export interface WishlistItemUpdate {
  notify_on_available?: boolean;
  preferred_library_id?: string;
  preferred_library_name?: string;
  user_notes?: string;
}

export const wishlistApi = {
  getAll: async (): Promise<WishlistItem[]> => {
    return apiFetch<WishlistItem[]>('/wishlist');
  },
  
  getById: async (id: number): Promise<WishlistItem> => {
    return apiFetch<WishlistItem>(`/wishlist/${id}`);
  },
  
  add: async (item: WishlistItemCreate): Promise<WishlistItem> => {
    return apiFetch<WishlistItem>('/wishlist', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  
  update: async (id: number, update: WishlistItemUpdate): Promise<WishlistItem> => {
    return apiFetch<WishlistItem>(`/wishlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
  
  remove: async (id: number): Promise<void> => {
    return apiFetch(`/wishlist/${id}`, { method: 'DELETE' });
  },
  
  clear: async (): Promise<void> => {
    return apiFetch('/wishlist', { method: 'DELETE' });
  },
};

// ============ RESERVATIONS API ============

export type ReservationStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'READY_FOR_PICKUP' 
  | 'PICKED_UP' 
  | 'CANCELLED' 
  | 'RETURNED';

export interface Reservation {
  id: number;
  user_id: number;
  finna_id: string;
  title: string;
  author: string | null;
  cover_image: string | null;
  library_id: string;
  library_name: string;
  status: ReservationStatus;
  reservation_date: string | null;
  pickup_date: string | null;
  pickup_deadline: string | null;
  due_date: string | null;
  return_date: string | null;
  queue_position: number | null;
  estimated_wait_days: number | null;
  reservation_number: string | null;
  user_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReservationCreate {
  finna_id: string;
  title: string;
  author?: string;
  cover_image?: string;
  library_id: string;
  library_name: string;
  user_notes?: string;
  queue_position?: number;
  estimated_wait_days?: number;
}

export interface ReservationUpdate {
  status?: ReservationStatus;
  pickup_date?: string;
  pickup_deadline?: string;
  due_date?: string;
  return_date?: string;
  queue_position?: number;
  user_notes?: string;
}

export const reservationsApi = {
  getAll: async (status?: ReservationStatus): Promise<Reservation[]> => {
    const params = status ? `?status=${status}` : '';
    return apiFetch<Reservation[]>(`/reservations${params}`);
  },
  
  getById: async (id: number): Promise<Reservation> => {
    return apiFetch<Reservation>(`/reservations/${id}`);
  },
  
  create: async (reservation: ReservationCreate): Promise<Reservation> => {
    return apiFetch<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
  },
  
  update: async (id: number, update: ReservationUpdate): Promise<Reservation> => {
    return apiFetch<Reservation>(`/reservations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
  
  cancel: async (id: number): Promise<void> => {
    return apiFetch(`/reservations/${id}`, { method: 'DELETE' });
  },
};

// ============ NOTIFICATIONS API ============

export type NotificationType = 
  | 'BOOK_AVAILABLE'
  | 'RESERVATION_CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'PICKUP_DEADLINE_APPROACHING'
  | 'RESERVATION_CANCELLED'
  | 'BOOK_PICKED_UP'
  | 'DUE_DATE_REMINDER'
  | 'OVERDUE';

export interface Notification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  book_title: string | null;
  library_name: string | null;
  finna_id: string | null;
  reservation_id: number | null;
  sent_at: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  getAll: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const params = unreadOnly ? '?unread_only=true' : '';
    return apiFetch<Notification[]>(`/notifications${params}`);
  },
  
  markAsRead: async (id: number): Promise<Notification> => {
    return apiFetch<Notification>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  },
  
  markAllAsRead: async (): Promise<void> => {
    return apiFetch('/notifications/mark-all-read', { method: 'POST' });
  },
  
  delete: async (id: number): Promise<void> => {
    return apiFetch(`/notifications/${id}`, { method: 'DELETE' });
  },
};

// ============ LIBRARIES API ============

export interface Library {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  library_system: string | null;
  is_active: boolean;
  external_id: string | null;
  email: string | null;
  homepage: string | null;
  phone: string | null;
  distance_km: number | null;
}

export const librariesApi = {
  getAll: async (params?: {
    latitude?: number;
    longitude?: number;
    maxDistanceKm?: number;
    city?: string;
    limit?: number;
  }): Promise<Library[]> => {
    const queryParams = new URLSearchParams();
    if (params?.latitude !== undefined) queryParams.append('latitude', String(params.latitude));
    if (params?.longitude !== undefined) queryParams.append('longitude', String(params.longitude));
    if (params?.maxDistanceKm !== undefined) queryParams.append('max_distance_km', String(params.maxDistanceKm));
    if (params?.city) queryParams.append('city', params.city);
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    
    const queryString = queryParams.toString();
    return apiFetch<Library[]>(`/libraries${queryString ? `?${queryString}` : ''}`);
  },
  
  getById: async (id: number, latitude?: number, longitude?: number): Promise<Library> => {
    const queryParams = new URLSearchParams();
    if (latitude !== undefined) queryParams.append('latitude', String(latitude));
    if (longitude !== undefined) queryParams.append('longitude', String(longitude));
    
    const queryString = queryParams.toString();
    return apiFetch<Library>(`/libraries/${id}${queryString ? `?${queryString}` : ''}`);
  },
  
  searchNearby: async (
    latitude: number,
    longitude: number,
    radiusKm?: number,
    limit?: number
  ): Promise<Library[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', String(latitude));
    queryParams.append('longitude', String(longitude));
    if (radiusKm !== undefined) queryParams.append('radius_km', String(radiusKm));
    if (limit !== undefined) queryParams.append('limit', String(limit));
    
    return apiFetch<Library[]>(`/libraries/nearby/search?${queryParams.toString()}`);
  },
};

// ============ HEALTH API ============

export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    return apiFetch<{ status: string }>('/health/');
  },
};

// ============ READING API ============

export interface ReadingItem {
  id: number;
  user_id: number;
  finna_id: string | null;
  title: string;
  author: string | null;
  cover_image: string | null;
  progress: number;
  library_id: string | null;
  library_name: string | null;
  due_date: string | null;
  start_date: string | null;
  user_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReadingItemCreate {
  finna_id?: string;
  title: string;
  author?: string;
  cover_image?: string;
  progress?: number;
  library_id?: string;
  library_name?: string;
  due_date?: string;
  start_date?: string;
  user_notes?: string;
}

export interface ReadingItemUpdate {
  progress?: number;
  due_date?: string;
  user_notes?: string;
}

export const readingApi = {
  getAll: async (): Promise<ReadingItem[]> => {
    return apiFetch<ReadingItem[]>('/reading');
  },
  
  getById: async (id: number): Promise<ReadingItem> => {
    return apiFetch<ReadingItem>(`/reading/${id}`);
  },
  
  add: async (item: ReadingItemCreate): Promise<ReadingItem> => {
    return apiFetch<ReadingItem>('/reading', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  
  update: async (id: number, update: ReadingItemUpdate): Promise<ReadingItem> => {
    return apiFetch<ReadingItem>(`/reading/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
  
  remove: async (id: number): Promise<void> => {
    return apiFetch(`/reading/${id}`, { method: 'DELETE' });
  },
  
  clear: async (): Promise<void> => {
    return apiFetch('/reading', { method: 'DELETE' });
  },
};

// ============ COMPLETED API ============

export interface CompletedItem {
  id: number;
  user_id: number;
  finna_id: string | null;
  title: string;
  author: string | null;
  cover_image: string | null;
  completed_date: string;
  rating: number | null;
  start_date: string | null;
  user_notes: string | null;
  review: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CompletedItemCreate {
  finna_id?: string;
  title: string;
  author?: string;
  cover_image?: string;
  completed_date: string;
  rating?: number;
  start_date?: string;
  user_notes?: string;
  review?: string;
}

export interface CompletedItemUpdate {
  rating?: number;
  user_notes?: string;
  review?: string;
}

export const completedApi = {
  getAll: async (): Promise<CompletedItem[]> => {
    return apiFetch<CompletedItem[]>('/completed');
  },
  
  getById: async (id: number): Promise<CompletedItem> => {
    return apiFetch<CompletedItem>(`/completed/${id}`);
  },
  
  add: async (item: CompletedItemCreate): Promise<CompletedItem> => {
    return apiFetch<CompletedItem>('/completed', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  
  update: async (id: number, update: CompletedItemUpdate): Promise<CompletedItem> => {
    return apiFetch<CompletedItem>(`/completed/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
  
  remove: async (id: number): Promise<void> => {
    return apiFetch(`/completed/${id}`, { method: 'DELETE' });
  },
  
  clear: async (): Promise<void> => {
    return apiFetch('/completed', { method: 'DELETE' });
  },
};

// ============ UNIFIED BOOKS API ============
// New unified API that replaces wishlist, reading, completed, reservations

export type ListType = 'wishlist' | 'reading' | 'completed' | 'reserved';
export type BookReservationStatus = 'pending' | 'confirmed' | 'ready_for_pickup' | 'picked_up' | 'cancelled' | 'returned';

export interface UserBook {
  id: number;
  list_type: ListType;
  finna_id: string;
  title: string;
  author: string | null;
  cover_image: string | null;
  year: string | null;
  isbn: string | null;
  // Library info
  library_id: string | null;
  library_name: string | null;
  // Dates
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  reservation_date: string | null;
  pickup_date: string | null;
  pickup_deadline: string | null;
  return_date: string | null;
  // Reading progress
  progress: number;
  // Rating (completed)
  rating: number | null;
  review: string | null;
  // Reservation
  status: BookReservationStatus | null;
  queue_position: number | null;
  estimated_wait_days: number | null;
  reservation_number: string | null;
  // Wishlist notifications
  notify_on_available: boolean;
  last_availability_check: string | null;
  is_available: boolean;
  availability_data: Record<string, unknown> | null;
  // Tracked libraries (for availability monitoring)
  tracked_libraries: string[] | null;
  // Notes
  user_notes: string | null;
  // Timestamps
  created_at: string;
  updated_at: string | null;
}

export interface UserBookCreate {
  list_type: ListType;
  finna_id: string;
  title: string;
  author?: string;
  cover_image?: string;
  year?: string;
  isbn?: string;
  library_id?: string;
  library_name?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  reservation_date?: string;
  pickup_deadline?: string;
  progress?: number;
  rating?: number;
  review?: string;
  status?: BookReservationStatus;
  queue_position?: number;
  estimated_wait_days?: number;
  notify_on_available?: boolean;
  tracked_libraries?: string[];
  user_notes?: string;
}

export interface UserBookUpdate {
  list_type?: ListType;  // Can move between lists!
  title?: string;
  author?: string;
  cover_image?: string;
  library_id?: string;
  library_name?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  reservation_date?: string;
  pickup_date?: string;
  pickup_deadline?: string;
  return_date?: string;
  progress?: number;
  rating?: number;
  review?: string;
  status?: BookReservationStatus;
  queue_position?: number;
  estimated_wait_days?: number;
  reservation_number?: string;
  notify_on_available?: boolean;
  tracked_libraries?: string[];
  user_notes?: string;
}

export const booksApi = {
  /**
   * Get all books, optionally filtered by list type
   */
  getAll: async (listType?: ListType): Promise<UserBook[]> => {
    const params = listType ? `?list=${listType}` : '';
    return apiFetch<UserBook[]>(`/books${params}`);
  },

  /**
   * Alias for getAll - get books from a specific list
   */
  getByList: async (listType: ListType): Promise<UserBook[]> => {
    return apiFetch<UserBook[]>(`/books?list=${listType}`);
  },
  
  /**
   * Get books from specific lists
   */
  getByLists: async (listTypes: ListType[]): Promise<UserBook[]> => {
    const params = listTypes.map(t => `list=${t}`).join('&');
    return apiFetch<UserBook[]>(`/books?${params}`);
  },
  
  /**
   * Get a specific book by ID
   */
  getById: async (id: number): Promise<UserBook> => {
    return apiFetch<UserBook>(`/books/${id}`);
  },
  
  /**
   * Add a book to a list
   */
  add: async (book: UserBookCreate): Promise<UserBook> => {
    return apiFetch<UserBook>('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  },
  
  /**
   * Update a book (including moving between lists)
   */
  update: async (id: number, update: UserBookUpdate): Promise<UserBook> => {
    return apiFetch<UserBook>(`/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
  
  /**
   * Move a book between lists
   */
  moveToList: async (id: number, newListType: ListType, additionalData?: Partial<UserBookUpdate>): Promise<UserBook> => {
    return apiFetch<UserBook>(`/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ list_type: newListType, ...additionalData }),
    });
  },
  
  /**
   * Remove a book
   */
  remove: async (id: number): Promise<void> => {
    return apiFetch(`/books/${id}`, { method: 'DELETE' });
  },
  
  /**
   * Clear all books from a specific list
   */
  clearList: async (listType: ListType): Promise<void> => {
    return apiFetch(`/books?list=${listType}`, { method: 'DELETE' });
  },
  
  // === Convenience methods for specific list types ===
  
  /**
   * Add to wishlist
   */
  addToWishlist: async (data: {
    finna_id: string;
    title: string;
    author?: string;
    cover_image?: string;
    year?: string;
    isbn?: string;
    notify_on_available?: boolean;
    library_id?: string;
    library_name?: string;
    tracked_libraries?: string[];
    user_notes?: string;
  }): Promise<UserBook> => {
    return booksApi.add({
      list_type: 'wishlist',
      ...data,
      notify_on_available: data.notify_on_available ?? true,
    });
  },
  
  /**
   * Add to reading list
   */
  addToReading: async (data: {
    finna_id: string;
    title: string;
    author?: string;
    cover_image?: string;
    progress?: number;
    due_date?: string;
    start_date?: string;
    library_id?: string;
    library_name?: string;
    user_notes?: string;
  }): Promise<UserBook> => {
    return booksApi.add({
      list_type: 'reading',
      ...data,
      progress: data.progress ?? 0,
      start_date: data.start_date ?? new Date().toISOString().split('T')[0],
    });
  },
  
  /**
   * Add to completed list
   */
  addToCompleted: async (data: {
    finna_id: string;
    title: string;
    author?: string;
    cover_image?: string;
    completed_date?: string;
    rating?: number;
    review?: string;
    start_date?: string;
    user_notes?: string;
  }): Promise<UserBook> => {
    return booksApi.add({
      list_type: 'completed',
      ...data,
      completed_date: data.completed_date ?? new Date().toISOString().split('T')[0],
      progress: 100,
    });
  },
  
  /**
   * Add reservation
   */
  addReservation: async (data: {
    finna_id: string;
    title: string;
    author?: string;
    cover_image?: string;
    library_id: string;
    library_name: string;
    queue_position?: number;
    estimated_wait_days?: number;
    user_notes?: string;
  }): Promise<UserBook> => {
    return booksApi.add({
      list_type: 'reserved',
      ...data,
      status: 'pending',
      reservation_date: new Date().toISOString(),
    });
  },
  
  /**
   * Move from reading to completed
   */
  completeBook: async (id: number, rating?: number, review?: string): Promise<UserBook> => {
    return booksApi.moveToList(id, 'completed', {
      completed_date: new Date().toISOString().split('T')[0],
      progress: 100,
      rating,
      review,
    });
  },
  
  /**
   * Move from wishlist to reading
   */
  startReading: async (id: number, dueDate?: string): Promise<UserBook> => {
    return booksApi.moveToList(id, 'reading', {
      start_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      progress: 0,
    });
  },
  
  /**
   * Move from reservation to reading (picked up)
   */
  pickUpReservation: async (id: number, dueDate: string): Promise<UserBook> => {
    return booksApi.moveToList(id, 'reading', {
      start_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      progress: 0,
    });
  },
  
  /**
   * Update reading progress
   */
  updateProgress: async (id: number, progress: number): Promise<UserBook> => {
    return booksApi.update(id, { progress });
  },
  
  /**
   * Update reservation status
   */
  updateReservationStatus: async (id: number, status: BookReservationStatus, additionalData?: Partial<UserBookUpdate>): Promise<UserBook> => {
    return booksApi.update(id, { status, ...additionalData });
  },
};

export default {
  auth: authApi,
  search: searchApi,
  // New unified API
  books: booksApi,
  // Legacy APIs (kept for backward compatibility)
  wishlist: wishlistApi,
  reservations: reservationsApi,
  reading: readingApi,
  completed: completedApi,
  // Other APIs
  notifications: notificationsApi,
  libraries: librariesApi,
  health: healthApi,
};
