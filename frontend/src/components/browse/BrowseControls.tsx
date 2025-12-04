import { ChangeEvent, KeyboardEvent } from 'react';
import { Filter, Loader2, MapPin, Navigation, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import type { Coordinates } from '../../services/geolocationService';
import type { AvailabilityFilter } from '../../utils/bookFilters';

interface BrowseControlsProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  availabilityOptions: AvailabilityFilter[];
  selectedAvailability: AvailabilityFilter;
  onSelectAvailability: (value: AvailabilityFilter) => void;
  isLoadingLocation: boolean;
  requestLocation: () => void;
  locationPermissionGranted: boolean;
  isUsingFallbackLocation: boolean;
  userLocation: Coordinates | null;
}

export function BrowseControls({
  inputValue,
  onInputChange,
  onSearch,
  isLoading,
  genres,
  selectedGenre,
  onSelectGenre,
  availabilityOptions,
  selectedAvailability,
  onSelectAvailability,
  isLoadingLocation,
  requestLocation,
  locationPermissionGranted,
  isUsingFallbackLocation,
  userLocation,
}: BrowseControlsProps) {
  const { theme, currentTheme } = useThemeTokens();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onInputChange(event.target.value);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  const locationButtonTone = (() => {
    if (locationPermissionGranted) {
      return themeClassName(theme, {
        base: 'shadow-md',
        light: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
        dark: 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50',
      });
    }

    if (isUsingFallbackLocation) {
      return themeClassName(theme, {
        base: 'shadow-md',
        light: 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100',
        dark: 'bg-amber-900/30 border-amber-700 text-amber-300 hover:bg-amber-900/50',
      });
    }

    return themeClassName(theme, {
      base: 'shadow-md',
      light: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
      dark: 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700',
    });
  })();

  const genreChipBase = 'px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all duration-300';
  const availabilityChipBase = genreChipBase;

  return (
    <div className="mb-6 md:mb-12">
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${currentTheme.textMuted}`}
          />
          <Input
            placeholder="Search by title, author, or topic..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={themeClassName(theme, {
              base: `pl-10 md:pl-12 ${currentTheme.inputBg} backdrop-blur-sm ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-12 md:h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50`,
              light: 'shadow-md',
              dark: '',
            })}
          />
        </div>
        <Button
          onClick={onSearch}
          disabled={isLoading || !inputValue.trim()}
          className={themeClassName(theme, {
            base: `bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} h-12 md:h-14 px-6 md:px-8 rounded-xl shadow-lg`,
            light: 'shadow-blue-300/50',
            dark: '',
          })}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 md:mr-2 animate-spin" />
              <span className="hidden md:inline">Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
              <span className="hidden md:inline">Search</span>
            </>
          )}
        </Button>
        <Button
          onClick={requestLocation}
          disabled={isLoadingLocation}
          variant="outline"
          className={`h-12 md:h-14 px-4 md:px-6 rounded-xl ${locationButtonTone}`}
          title="Enable location to sort by distance"
        >
          {isLoadingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : locationPermissionGranted ? (
            <Navigation className="w-5 h-5" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </Button>
      </div>

      {locationPermissionGranted && userLocation ? (
        <div
          className={themeClassName(theme, {
            base: 'mt-4 p-3 rounded-lg flex items-center gap-2',
            light: 'bg-green-50 border border-green-200',
            dark: 'bg-green-900/20 border border-green-800',
          })}
        >
          <Navigation
            className={themeClassName(theme, {
              base: 'w-4 h-4',
              light: 'text-green-700',
              dark: 'text-green-400',
            })}
          />
          <span
            className={themeClassName(theme, {
              base: 'text-sm',
              light: 'text-green-700',
              dark: 'text-green-400',
            })}
          >
            Location enabled - Results sorted by distance
          </span>
        </div>
      ) : isUsingFallbackLocation && userLocation ? (
        <div
          className={themeClassName(theme, {
            base: 'mt-4 p-3 rounded-lg flex items-center gap-2',
            light: 'bg-yellow-50 border border-yellow-200',
            dark: 'bg-amber-900/20 border border-amber-800',
          })}
        >
          <MapPin
            className={themeClassName(theme, {
              base: 'w-4 h-4',
              light: 'text-yellow-700',
              dark: 'text-amber-300',
            })}
          />
          <span
            className={themeClassName(theme, {
              base: 'text-sm',
              light: 'text-yellow-700',
              dark: 'text-amber-200',
            })}
          >
            Using Helsinki fallback location. Enable location services for more accurate results.
          </span>
        </div>
      ) : null}

      <div className="space-y-6 md:space-y-0 md:flex md:gap-8">
        <div className="flex-1">
          <div
            className={themeClassName(theme, {
              base: 'flex items-center gap-2 mb-3 md:mb-4',
              light: 'text-slate-700',
              dark: 'text-slate-300',
            })}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Genre</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => onSelectGenre(genre)}
                className={
                  selectedGenre === genre
                    ? themeClassName(theme, {
                        base: genreChipBase,
                        light: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md',
                        dark: 'bg-blue-600 text-white',
                      })
                    : themeClassName(theme, {
                        base: genreChipBase,
                        light: 'bg-blue-50 text-slate-700 hover:bg-blue-100',
                        dark: 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60',
                      })
                }
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div
            className={themeClassName(theme, {
              base: 'flex items-center gap-2 mb-3 md:mb-4',
              light: 'text-slate-700',
              dark: 'text-slate-300',
            })}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Availability</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((option) => (
              <button
                key={option}
                onClick={() => onSelectAvailability(option)}
                className={
                  selectedAvailability === option
                    ? themeClassName(theme, {
                        base: availabilityChipBase,
                        light: 'bg-blue-600 text-white shadow-md',
                        dark: 'bg-blue-600 text-white',
                      })
                    : themeClassName(theme, {
                        base: availabilityChipBase,
                        light: 'bg-blue-50 text-slate-700 hover:bg-blue-100',
                        dark: 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60',
                      })
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
