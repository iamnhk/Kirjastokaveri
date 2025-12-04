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
    light: 'border-blue-300 text-blue-700',
    dark: 'border-slate-700 text-slate-400',
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
    light: 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300',
    dark: 'bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-700/60 hover:border-slate-600',
  });

  return (
    <BookCard
      image={book.imageUrl}
      title={book.title}
      onClick={handleCardClick}
      shadow="raised"
      coverClassName="md:rounded-2xl"
      overlay={
        <>
          <Badge
            className={`absolute top-2 md:top-3 right-2 md:right-3 text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full ${availabilityColor} text-slate-900`}
          >
            <span className="hidden md:inline">{availabilityStatus}</span>
            <span className="md:hidden">{totalAvailable > 0 ? totalAvailable : 'N/A'}</span>
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
