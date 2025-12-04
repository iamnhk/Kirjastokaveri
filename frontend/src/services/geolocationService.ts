/**
 * Geolocation Service
 * Handles user location and distance calculations
 * 
 * This service fetches library coordinates from the backend API,
 * which uses data from Kirjastot.fi (972+ Finnish libraries with GPS coordinates).
 */

const API_BASE_URL = '/api';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocationResult {
  coordinates: Coordinates;
  isFallback: boolean;
}

export interface LibraryLocation {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  library_system: string | null;
  distance_km: number | null;
}

// Cache for library coordinates fetched from API
let libraryCoordinatesCache: Map<string, Coordinates> = new Map();
let librariesListCache: LibraryLocation[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Default Helsinki coordinates for fallback
const DEFAULT_COORDINATES: Coordinates = { latitude: 60.1699, longitude: 24.9384 };

/**
 * Fetch libraries from the backend API
 * The backend uses data from Kirjastot.fi (972+ Finnish libraries)
 */
export async function fetchLibraries(
  userLatitude?: number,
  userLongitude?: number,
  limit: number = 100
): Promise<LibraryLocation[]> {
  // Check cache validity
  if (librariesListCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return librariesListCache;
  }

  try {
    const params = new URLSearchParams();
    if (userLatitude !== undefined && userLongitude !== undefined) {
      params.append('latitude', userLatitude.toString());
      params.append('longitude', userLongitude.toString());
    }
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/libraries?${params.toString()}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch libraries: ${response.status}`);
      return [];
    }

    const libraries: LibraryLocation[] = await response.json();
    
    // Update cache
    librariesListCache = libraries;
    cacheTimestamp = Date.now();

    // Also populate the coordinates cache
    for (const lib of libraries) {
      if (lib.latitude && lib.longitude) {
        libraryCoordinatesCache.set(lib.name.toLowerCase(), {
          latitude: lib.latitude,
          longitude: lib.longitude,
        });
      }
    }

    return libraries;
  } catch (error) {
    console.error('Error fetching libraries from API:', error);
    return [];
  }
}

/**
 * Get nearby libraries sorted by distance
 */
export async function getNearbyLibraries(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 10
): Promise<LibraryLocation[]> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius_km: radiusKm.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/libraries/nearby/search?${params.toString()}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch nearby libraries: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching nearby libraries:', error);
    return [];
  }
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getUserLocation(): Promise<UserLocationResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve({
        coordinates: DEFAULT_COORDINATES,
        isFallback: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isFallback: false,
        });
      },
      (error) => {
        console.warn('Error getting user location:', error.message);
        resolve({
          coordinates: DEFAULT_COORDINATES,
          isFallback: true,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get library coordinates by name
 * First tries the cache (populated from API), then falls back to API lookup
 */
export async function getLibraryCoordinates(libraryName: string): Promise<Coordinates> {
  const normalizedName = libraryName.toLowerCase();

  // Check cache first
  if (libraryCoordinatesCache.has(normalizedName)) {
    return libraryCoordinatesCache.get(normalizedName)!;
  }

  // Try partial match in cache
  for (const [key, coords] of libraryCoordinatesCache) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return coords;
    }
  }

  // If cache is empty, try to populate it
  if (libraryCoordinatesCache.size === 0) {
    await fetchLibraries();
    
    // Try again after fetching
    if (libraryCoordinatesCache.has(normalizedName)) {
      return libraryCoordinatesCache.get(normalizedName)!;
    }

    for (const [key, coords] of libraryCoordinatesCache) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        return coords;
      }
    }
  }

  // Return default (Helsinki center)
  return DEFAULT_COORDINATES;
}

/**
 * Get library coordinates synchronously (from cache only)
 * Use this when you need immediate result without async
 */
export function getLibraryCoordinatesSync(libraryName: string): Coordinates {
  const normalizedName = libraryName.toLowerCase();

  // Check cache
  if (libraryCoordinatesCache.has(normalizedName)) {
    return libraryCoordinatesCache.get(normalizedName)!;
  }

  // Try partial match
  for (const [key, coords] of libraryCoordinatesCache) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return coords;
    }
  }

  return DEFAULT_COORDINATES;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm}km`;
}

/**
 * Check if user has granted location permission
 */
export async function checkLocationPermission(): Promise<boolean> {
  if (!navigator.permissions) {
    return false;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state === 'granted';
  } catch {
    return false;
  }
}
