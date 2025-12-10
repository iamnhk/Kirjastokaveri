import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { searchApi, type AvailabilityItem } from '../../services/apiClient';
import type { BuildingInfo } from '../../services/finnaApi';

interface LibraryLocation extends BuildingInfo {
  lat?: number;
  lon?: number;
  address?: string;
}

interface LibraryMapProps {
  buildings: BuildingInfo[];
  bookTitle?: string;
  recordId?: string; // Finna record ID to fetch availability with distance
}

export function LibraryMap({ buildings, bookTitle, recordId }: LibraryMapProps) {
  const { theme, currentTheme } = useThemeTokens();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityItem[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const toRad = (degrees: number): number => degrees * (Math.PI / 180);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const libraryCoordinates: Record<string, { lat: number; lon: number; address: string }> = {
    Helsinki: { lat: 60.1699, lon: 24.9384, address: 'Rautatientori 8, Helsinki' },
    Espoo: { lat: 60.2055, lon: 24.6559, address: 'Karhusaarentie 3, Espoo' },
    Vantaa: { lat: 60.2934, lon: 25.0378, address: 'Kielotie 13, Vantaa' },
    Tampere: { lat: 61.4978, lon: 23.761, address: 'Pirkankatu 2, Tampere' },
    Turku: { lat: 60.4518, lon: 22.2666, address: 'Linnankatu 2, Turku' },
    Oulu: { lat: 65.0121, lon: 25.4651, address: 'Kaarlenväylä 3, Oulu' },
    Jyväskylä: { lat: 62.2426, lon: 25.7473, address: 'Vapaudenkatu 39-41, Jyväskylä' },
    Lahti: { lat: 60.9827, lon: 25.6612, address: 'Kirkkokatu 31, Lahti' },
    Kuopio: { lat: 62.8924, lon: 27.6782, address: 'Minna Canthin katu 13, Kuopio' },
    Pori: { lat: 61.4851, lon: 21.7974, address: 'Gallen-Kallelankatu 12, Pori' },
  };

  // Fetch availability from backend API with user location for distance calculation
  const fetchAvailabilityWithDistance = useCallback(async (lat: number, lon: number) => {
    if (!recordId) return;
    
    setIsLoadingAvailability(true);
    try {
      const response = await searchApi.getAvailability(recordId, lat, lon);
      setAvailabilityData(response.items);
    } catch (error) {
      console.error('Failed to fetch availability with distance:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [recordId]);

  // Build libraries list - prefer API data with distance, fallback to buildings prop
  const librariesWithCoords: LibraryLocation[] = availabilityData.length > 0
    ? availabilityData.map((item) => ({
        building: item.library,
        available: item.available_count ?? 0,
        total: item.total_count ?? 1,
        location: item.location ?? undefined,
        callnumber: item.call_number ?? undefined,
        distance: item.distance_km ?? undefined,
        status: item.status,
        url: item.url ?? undefined,
        // API provides distance_km directly from backend with real coordinates
      }))
    : buildings.map((building) => {
        // Fallback: use hardcoded city coordinates
        const cityMatch = Object.keys(libraryCoordinates).find((city) =>
          building.building.toLowerCase().includes(city.toLowerCase()),
        );
        const coords = cityMatch ? libraryCoordinates[cityMatch] : undefined;
        return {
          ...building,
          lat: coords?.lat,
          lon: coords?.lon,
          address: coords?.address,
          distance:
            userLocation && coords
              ? calculateDistance(userLocation.lat, userLocation.lon, coords.lat, coords.lon)
              : undefined,
        };
      }).filter((lib) => lib.lat && lib.lon);

  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setIsLoadingLocation(false);
        },
        () => {
          setUserLocation({ lat: 60.1699, lon: 24.9384 });
          setIsLoadingLocation(false);
        },
        {
          timeout: 10000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        },
      );
    } else {
      setUserLocation({ lat: 60.1699, lon: 24.9384 });
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch availability with distance when user location is available
  useEffect(() => {
    if (userLocation && recordId) {
      fetchAvailabilityWithDistance(userLocation.lat, userLocation.lon);
    }
  }, [userLocation, recordId, fetchAvailabilityWithDistance]);

  const sortedLibraries = [...librariesWithCoords].sort((a, b) => {
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });

  if (isLoadingAvailability) {
    return (
      <div className={`text-center py-8 ${currentTheme.textMuted}`}>
        <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
        <p>Loading library locations...</p>
      </div>
    );
  }

  if (librariesWithCoords.length === 0) {
    return (
      <div className={`text-center py-8 ${currentTheme.textMuted}`}>
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No location data available for these libraries</p>
        {!recordId && (
          <p className="text-xs mt-2">Try opening the book from search results for distance info</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`w-5 h-5 ${currentTheme.textMuted}`} />
          <h3 className={`${currentTheme.text}`}>
            {bookTitle ? `"${bookTitle}" near you` : 'Nearby Libraries'}
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={getUserLocation}
          disabled={isLoadingLocation}
          className={`${theme === 'light' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-slate-700 text-white hover:bg-slate-800'}`}
        >
          {isLoadingLocation ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Update Location
        </Button>
      </div>

      <div
        ref={mapRef}
        className={`relative h-96 rounded-xl overflow-hidden border ${currentTheme.border} ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${theme === 'light' ? 'cbd5e1' : '475569'}' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {userLocation && (
              <div
                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '50%', top: '50%' }}
              >
                <div className={`w-4 h-4 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-blue-400'} border-2 border-white shadow-lg animate-pulse`} />
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${theme === 'light' ? 'bg-blue-400' : 'bg-blue-500'} opacity-30 animate-ping`} />
              </div>
            )}

            {sortedLibraries.slice(0, 5).map((library, index) => {
              const angle = (index / 5) * Math.PI * 2;
              const radius = 35;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedLibrary(library)}
                  className="absolute z-10 transform -translate-x-1/2 -translate-y-full group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className={`relative transition-transform hover:scale-110 ${selectedLibrary === library ? 'scale-110' : ''}`}>
                    <MapPin
                      className={`w-8 h-8 ${
                        library.available > 0
                          ? theme === 'light'
                            ? 'text-green-600'
                            : 'text-green-400'
                          : theme === 'light'
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      } drop-shadow-lg`}
                      fill={library.available > 0 ? 'currentColor' : 'none'}
                    />
                    {library.available > 0 && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${theme === 'light' ? 'bg-green-600' : 'bg-green-500'} border-2 border-white flex items-center justify-center text-xs text-white`}>
                        {library.available}
                      </div>
                    )}
                  </div>
                  <div className={`absolute left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 rounded text-xs whitespace-nowrap ${currentTheme.cardBg} ${currentTheme.border} border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                    {library.building}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`absolute bottom-4 left-4 ${currentTheme.cardBg} ${currentTheme.border} border rounded-lg px-3 py-2 text-xs space-y-1 shadow-lg`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-blue-400'}`} />
            <span className={currentTheme.text}>Your location</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className={`w-3 h-3 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} fill="currentColor" />
            <span className={currentTheme.text}>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className={`w-3 h-3 ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={currentTheme.text}>On loan</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className={`text-sm ${currentTheme.textMuted}`}>
          {sortedLibraries.length} {sortedLibraries.length === 1 ? 'library' : 'libraries'} found
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedLibraries.map((library, index) => (
            <button
              key={index}
              onClick={() => setSelectedLibrary(library)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedLibrary === library
                  ? theme === 'light'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-slate-700 border-blue-500'
                  : theme === 'light'
                  ? 'bg-white border-slate-200 hover:border-blue-200'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`mb-1 flex items-center gap-2`}>
                    <span className={`${currentTheme.text} truncate`}>{library.building}</span>
                    {library.distance !== undefined && (
                      <Badge variant="outline" className={`text-xs ${theme === 'light' ? 'border-green-300 text-green-700 bg-green-50' : 'border-green-600 text-green-400 bg-green-900/30'}`}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {library.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </div>
                  {library.address && (
                    <p className={`text-xs ${currentTheme.textMuted}`}>{library.address}</p>
                  )}
                  {library.location && (
                    <p className={`text-xs ${currentTheme.textMuted} mt-1`}>{library.location}</p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    library.available > 0
                      ? theme === 'light'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-500/20 text-green-400'
                      : theme === 'light'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  <span className="text-sm">
                    {library.available}/{library.total}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
