import { MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { BuildingInfo } from '../../services/finnaApi';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { Badge } from '../ui/badge';

interface BookAvailabilityProps {
  buildings: BuildingInfo[];
  compact?: boolean;
}

// Helper to check if a building is available based on status or available count
function isAvailable(building: BuildingInfo): boolean {
  if (building.status) {
    const status = building.status.toLowerCase();
    return status === 'available' || status.includes('available');
  }
  return building.available > 0;
}

export function BookAvailability({ buildings, compact = false }: BookAvailabilityProps) {
  const { theme, currentTheme } = useThemeTokens();

  if (!buildings || buildings.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${currentTheme.textMuted} text-sm`}>
        <XCircle className="w-4 h-4" />
        <span>No availability information</span>
      </div>
    );
  }

  // Count available items using either status field or available count
  const availableCount = buildings.filter(isAvailable).length;
  const totalAvailable = buildings.reduce((sum, b) => sum + (isAvailable(b) ? 1 : 0), 0);
  const totalCopies = buildings.length;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {availableCount > 0 ? (
            <>
              <CheckCircle2 className={`w-4 h-4 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
              <span className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>
                Available now
              </span>
            </>
          ) : (
            <>
              <Clock className={`w-4 h-4 ${currentTheme.textMuted}`} />
              <span className={`text-sm ${currentTheme.textMuted}`}>
                All copies on loan
              </span>
            </>
          )}
        </div>
        <div className={`text-xs ${currentTheme.textMuted}`}>
          {totalAvailable} of {totalCopies} available at {buildings.length} {buildings.length === 1 ? 'library' : 'libraries'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between pb-2 border-b ${currentTheme.border}`}>
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${currentTheme.textMuted}`} />
          <span className={`${currentTheme.text}`}>Library Availability</span>
        </div>
        <Badge variant={availableCount > 0 ? 'default' : 'secondary'} className={availableCount > 0 ? (theme === 'light' ? 'bg-green-600' : 'bg-green-500') : ''}>
          {totalAvailable} / {totalCopies} available
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {buildings.map((building, index) => {
          const available = isAvailable(building);
          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/30'} border ${currentTheme.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`${currentTheme.text} mb-1 truncate`}>
                    {building.building}
                  </div>
                  {building.location && (
                    <div className={`text-xs ${currentTheme.textMuted}`}>
                      Shelf: {building.location}
                    </div>
                  )}
                  {building.distance != null && (
                    <div className={`text-xs ${currentTheme.textMuted} mt-1`}>
                      📍 {building.distance.toFixed(1)} km away
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {available ? (
                    <div className={`flex items-center gap-1 ${theme === 'light' ? 'text-green-700' : 'text-green-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Available</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1 ${currentTheme.textMuted}`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{building.status || 'On Loan'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
