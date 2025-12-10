import { MouseEvent } from 'react';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BookCard } from './BookCard';
import type { FinnaBook, BuildingInfo } from '../../services/finnaApi';
import { formatDistance } from '../../services/geolocationService';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { themeClassName } from '../../utils/themeClassName';
import {
  getAvailabilityColorClass,
  getAvailabilityStatus,
  getTotalAvailableCopies,
} from '../../utils/bookAvailability';

interface BookResultCardProps {
  book: FinnaBook;
  closestLocation: BuildingInfo | null;
  isInWishlist: boolean;
  onSelect: (book: FinnaBook) => void;
  onAddToWishlist: (book: FinnaBook) => void;
}

export function BookResultCard({
  book,
  closestLocation,
  isInWishlist,
  onSelect,
  onAddToWishlist,
}: BookResultCardProps) {
  const { theme, currentTheme } = useThemeTokens();

  const totalAvailable = getTotalAvailableCopies(book);
  const availabilityStatus = getAvailabilityStatus(totalAvailable);
  const availabilityColor = getAvailabilityColorClass(availabilityStatus);

  const handleCardClick = () => onSelect(book);
  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isInWishlist) {
      onAddToWishlist(book);
    }
  };

  const yearBadgeClass = themeClassName(theme, {
    base: 'absolute bottom-2 md:bottom-3 left-2 md:left-3 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full',
    light: 'bg-white/90',
    dark: 'bg-slate-900/80',
  });

  const subjectBadgeClass = themeClassName(theme, {
    base: 'mb-2 text-xs',
    light: 'border-purple-300 text-purple-700',
    dark: 'border-slate-700 text-purple-300',
  });

  const distanceIconClass = themeClassName(theme, {
    base: 'w-3 h-3',
    light: 'text-green-700',
    dark: 'text-green-400',
  });

  const distanceLabelClass = themeClassName(theme, {
    base: '',
    light: 'text-green-700',
    dark: 'text-green-400',
  });

  const wishlistButtonClass = themeClassName(theme, {
    base: `w-full border text-xs md:text-sm py-2 rounded-lg flex items-center justify-center gap-2 ${isInWishlist ? 'opacity-60 cursor-default hover:bg-transparent' : ''}`,
    light: 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300',
    dark: 'bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-700/60 hover:border-slate-600',
  });

  const FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(147,51,234);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(219,39,119);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23grad)"/%3E%3Ctext x="200" y="280" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle"%3E📚%3C/text%3E%3Ctext x="200" y="340" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.9"%3ENo Cover%3C/text%3E%3Ctext x="200" y="370" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.7"%3EAvailable%3C/text%3E%3C/svg%3E';

  return (
    <BookCard
      image={book.imageUrl || FALLBACK}
      title={book.title}
      onClick={handleCardClick}
      shadow="raised"
      coverClassName="md:rounded-2xl"
      overlay={
        <>
          <Badge
            className={`absolute top-2 md:top-3 right-2 md:right-3 text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full ${availabilityColor} text-slate-900`}
          >
            <span className="hidden md:inline">{availabilityStatus === 'Unknown' ? 'Check Availability' : availabilityStatus}</span>
            <span className="md:hidden">{totalAvailable > 0 ? totalAvailable : totalAvailable === -1 ? '?' : 'N/A'}</span>
          </Badge>
          {book.year && (
            <div className={yearBadgeClass}>
              <span className={`text-xs md:text-sm ${currentTheme.textMuted}`}>{book.year}</span>
            </div>
          )}
        </>
      }
      footer={
        <Button variant="outline" disabled={isInWishlist} className={wishlistButtonClass} onClick={handleWishlistClick}>
          <Star className="w-4 h-4" />
          <span className="hidden md:inline">{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
          <span className="md:hidden">{isInWishlist ? 'Saved' : 'Save'}</span>
        </Button>
      }
    >
      {book.subjects && book.subjects.length > 0 && (
        <Badge variant="outline" className={subjectBadgeClass}>
          {book.subjects[0].length > 20 ? `${book.subjects[0].substring(0, 20)}...` : book.subjects[0]}
        </Badge>
      )}

      {closestLocation && (
        <div className="flex items-center gap-1 text-xs">
          {closestLocation.distance !== undefined ? (
            <>
              <MapPin className={distanceIconClass} />
              <span className={distanceLabelClass}>{formatDistance(closestLocation.distance)} away</span>
              <span className={currentTheme.textMuted}>•</span>
              <span className={currentTheme.textMuted} title={closestLocation.building}>
                {closestLocation.building.length > 15
                  ? `${closestLocation.building.substring(0, 15)}...`
                  : closestLocation.building}
              </span>
            </>
          ) : (
            <>
              <MapPin className={`w-3 h-3 ${currentTheme.textMuted}`} />
              <span className={currentTheme.textMuted} title={closestLocation.building}>
                {closestLocation.building.length > 20
                  ? `${closestLocation.building.substring(0, 20)}...`
                  : closestLocation.building}
              </span>
            </>
          )}
        </div>
      )}

      <h3 className={`${currentTheme.text} text-xs md:text-sm line-clamp-2`}>{book.title}</h3>
      <p className={`${currentTheme.textMuted} text-xs md:mb-1 line-clamp-1`}>{book.author}</p>
    </BookCard>
  );
}
