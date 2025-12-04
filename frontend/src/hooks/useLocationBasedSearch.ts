import { useState, useEffect, useCallback } from 'react';
import type { FinnaBook, BuildingInfo } from '../services/finnaApi';
import {
  getUserLocation,
  calculateDistance,
  getLibraryCoordinatesSync,
  fetchLibraries,
} from '../services/geolocationService';
import type {
  Coordinates,
  UserLocationResult,
} from '../services/geolocationService';

export interface LocationState {
  userLocation: Coordinates | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  locationPermissionGranted: boolean;
  isUsingFallbackLocation: boolean;
}

/**
 * Hook to enrich books with distance information and sort by proximity
 */
export function useLocationBasedSearch() {
  const [locationState, setLocationState] = useState<LocationState>({
    userLocation: null,
    isLoadingLocation: false,
    locationError: null,
    locationPermissionGranted: false,
    isUsingFallbackLocation: false,
  });

  /**
   * Request user's location
   */
  const requestLocation = useCallback(async () => {
    setLocationState(prev => ({ ...prev, isLoadingLocation: true, locationError: null }));
    
    try {
      // Pre-fetch library coordinates from API to populate the cache
      await fetchLibraries();
      
      const locationResult = await getUserLocation();

      if (locationResult) {
        const { coordinates, isFallback } = locationResult;
        setLocationState({
          userLocation: coordinates,
          isLoadingLocation: false,
          locationError: isFallback ? 'Using default Helsinki location. Enable location services for precise results.' : null,
          locationPermissionGranted: !isFallback,
          isUsingFallbackLocation: isFallback,
        });

        const payload: UserLocationResult = {
          coordinates,
          isFallback,
        };

        // Save to localStorage for future use
        localStorage.setItem('userLocation', JSON.stringify(payload));
      } else {
        setLocationState(prev => ({
          ...prev,
          isLoadingLocation: false,
          locationError: 'Could not get your location',
          locationPermissionGranted: false,
          isUsingFallbackLocation: false,
        }));
      }
    } catch (error) {
      setLocationState(prev => ({
        ...prev,
        isLoadingLocation: false,
        locationError: 'Failed to get location',
        locationPermissionGranted: false,
        isUsingFallbackLocation: false,
      }));
    }
  }, []);

  /**
   * Load saved location from localStorage on mount
   */
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation) as Partial<UserLocationResult> | Coordinates;
        const coordinates = (parsed as Partial<UserLocationResult>).coordinates ?? (parsed as Coordinates);
        const isFallback = typeof (parsed as Partial<UserLocationResult>).isFallback === 'boolean'
          ? Boolean((parsed as Partial<UserLocationResult>).isFallback)
          : false;

        if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
          setLocationState(prev => ({
            ...prev,
            userLocation: coordinates,
            locationPermissionGranted: !isFallback,
            isUsingFallbackLocation: isFallback,
          }));
        }
      } catch {
        // Invalid saved location, ignore
      }
    }
  }, []);

  /**
   * Calculate distance for a building
   */
  const calculateBuildingDistance = useCallback(
    (building: BuildingInfo): number | undefined => {
      if (!locationState.userLocation) return undefined;

      const libraryCoords = getLibraryCoordinatesSync(building.building);
      return calculateDistance(locationState.userLocation, libraryCoords);
    },
    [locationState.userLocation]
  );

  /**
   * Enrich a single book with distance information
   */
  const enrichBookWithDistance = useCallback(
    (book: FinnaBook): FinnaBook => {
      if (!locationState.userLocation || !book.buildings) {
        return book;
      }

      const enrichedBuildings = book.buildings.map(building => ({
        ...building,
        distance: calculateBuildingDistance(building),
      }));

      // Sort buildings by distance (closest first)
      enrichedBuildings.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      return {
        ...book,
        buildings: enrichedBuildings,
      };
    },
    [locationState.userLocation, calculateBuildingDistance]
  );

  /**
   * Enrich books array with distance information and sort by closest available
   */
  const enrichBooksWithDistance = useCallback(
    (books: FinnaBook[]): FinnaBook[] => {
      if (!locationState.userLocation) {
        return books;
      }

      // Enrich each book
      const enrichedBooks = books.map(enrichBookWithDistance);

      // Sort books by closest available copy
      enrichedBooks.sort((a, b) => {
        const aClosestAvailable = a.buildings?.find(b => b.available > 0 && b.distance !== undefined);
        const bClosestAvailable = b.buildings?.find(b => b.available > 0 && b.distance !== undefined);

        // Books with available copies come first
        if (aClosestAvailable && !bClosestAvailable) return -1;
        if (!aClosestAvailable && bClosestAvailable) return 1;

        // Sort by distance if both have available copies
        if (aClosestAvailable && bClosestAvailable) {
          return (aClosestAvailable.distance || Infinity) - (bClosestAvailable.distance || Infinity);
        }

        // If neither has available copies, sort by closest library (any copy)
        const aClosest = a.buildings?.[0]?.distance;
        const bClosest = b.buildings?.[0]?.distance;
        
        if (aClosest === undefined && bClosest === undefined) return 0;
        if (aClosest === undefined) return 1;
        if (bClosest === undefined) return -1;
        
        return aClosest - bClosest;
      });

      return enrichedBooks;
    },
    [locationState.userLocation, enrichBookWithDistance]
  );

  /**
   * Get the closest available location for a book
   */
  const getClosestAvailableLocation = useCallback(
    (book: FinnaBook): BuildingInfo | null => {
      if (!book.buildings || book.buildings.length === 0) return null;

      const availableBuildings = book.buildings.filter(b => b.available > 0);
      
      if (availableBuildings.length === 0) return null;

      // If distances are calculated, return the closest one
      if (locationState.userLocation) {
        return availableBuildings.reduce((closest, current) => {
          if (!closest.distance) return current;
          if (!current.distance) return closest;
          return current.distance < closest.distance ? current : closest;
        });
      }

      // Otherwise return the first available location
      return availableBuildings[0];
    },
    [locationState.userLocation]
  );

  return {
    ...locationState,
    requestLocation,
    enrichBookWithDistance,
    enrichBooksWithDistance,
    getClosestAvailableLocation,
    calculateBuildingDistance,
  };
}
