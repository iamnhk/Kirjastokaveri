import { BookOpen, Shield, Loader2, Sparkles, Globe, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookCard } from '../book/BookCard';
import { ImageWithFallback } from '../common/ImageWithFallback';
import type { FinnaBook } from '../../services/finnaApi';

export type ThemeKey = 'light' | 'dark';
export type ThemeDefinition = Record<string, string>;

export interface FeatureDefinition {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface HomeHeroSectionProps {
  theme: ThemeKey;
  currentTheme: ThemeDefinition;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  backgroundBookCovers: string[];
}

export function HomeHeroSection({
  theme,
  currentTheme,
  searchQuery,
  onSearchChange,
  onSearch,
  backgroundBookCovers,
}: HomeHeroSectionProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${
        theme === 'light' ? currentTheme.heroBg : 'from-blue-950 via-slate-900 to-slate-900'
      }`}
    >
      <div className={`absolute inset-0 ${theme === 'light' ? 'opacity-20' : 'opacity-40'}`}>
        <div className="hidden md:grid grid-cols-12 gap-2 p-4">
          {Array.from({ length: 60 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded overflow-hidden shadow-lg">
              <ImageWithFallback
                src={backgroundBookCovers[index % backgroundBookCovers.length]}
                alt="Book cover"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={`absolute inset-0 ${
          theme === 'light'
            ? 'bg-gradient-to-b from-white/80 via-white/70 to-white/90'
            : 'bg-gradient-to-b from-blue-950/90 via-slate-900/85 to-slate-900/95'
        }`}
      />

      <div className="relative z-10 px-4 md:px-12 pb-12 md:pb-24 pt-8 md:pt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${currentTheme.text} text-4xl md:text-6xl lg:text-7xl mb-4 md:mb-6 leading-tight`}>
            Discover Books.
            <br className="hidden md:block" />
            Find Your Next Read.
          </h1>
          <p
            className={`${
              theme === 'light' ? 'text-slate-700' : 'text-white/80'
            } text-base md:text-lg mb-8 md:mb-16 px-4`}
          >
            Your gateway to library availability, personalized lists, and instant notifications.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-3xl mx-auto">
            <div className="hidden md:flex flex-col gap-3 text-left">
              <div
                className={`flex items-center gap-2 ${
                  theme === 'light' ? 'text-blue-700' : 'text-white/70'
                } text-sm`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Million+ Books</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  theme === 'light' ? 'text-blue-700' : 'text-white/70'
                } text-sm`}
              >
                <Shield className="w-4 h-4" />
                <span>50,000+ Readers</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
              <Input
                placeholder="Find your next adventure..."
                className={`w-full ${currentTheme.inputBg} backdrop-blur-sm ${currentTheme.inputBorder} ${currentTheme.text} placeholder:text-slate-400 h-12 md:h-14 px-4 md:px-6 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
                  theme === 'light' ? 'shadow-md' : ''
                }`}
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyPress={(event) => event.key === 'Enter' && onSearch()}
              />
              <Button
                className={`bg-gradient-to-r ${currentTheme.buttonGradient} hover:${currentTheme.buttonGradientHover} h-12 md:h-14 px-8 md:px-10 rounded-full shadow-lg ${
                  theme === 'light' ? 'shadow-blue-300/50' : 'shadow-blue-500/30'
                } w-full md:w-auto`}
                onClick={onSearch}
              >
                Explore Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HomeFeaturesSectionProps {
  theme: ThemeKey;
  currentTheme: ThemeDefinition;
  features: FeatureDefinition[];
}

export function HomeFeaturesSection({ theme, currentTheme, features }: HomeFeaturesSectionProps) {
  return (
    <div className={`px-4 md:px-12 py-12 md:py-20 ${currentTheme.sectionBg}`}>
      <h2 className={`${currentTheme.text} text-xl md:text-2xl mb-8 md:mb-12`}>How it works</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`${
              theme === 'light'
                ? 'bg-blue-50/50 border-blue-200'
                : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
            } backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 text-center border transition-all duration-300 ${
              theme === 'light' ? 'hover:shadow-lg hover:shadow-blue-200/50' : ''
            }`}
          >
            <div className="flex justify-center mb-3 md:mb-6">
              <div
                className={`p-2 md:p-4 rounded-xl md:rounded-2xl ${theme === 'light' ? 'bg-blue-100' : ''}`}
                style={theme === 'dark' ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' } : {}}
              >
                <feature.icon
                  className={`w-8 h-8 md:w-14 md:h-14 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-400/80'
                  }`}
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h3
              className={`${
                theme === 'light' ? 'text-slate-900' : 'text-white/90'
              } text-sm md:text-base mb-2 md:mb-3`}
            >
              {feature.title}
            </h3>
            <p className={`${currentTheme.textMuted} text-xs md:text-sm leading-relaxed hidden md:block`}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HomePopularSectionProps {
  theme: ThemeKey;
  currentTheme: ThemeDefinition;
  activeTab: 'trending' | 'new' | 'picks' | 'recommended';
  isAuthenticated: boolean;
  books: FinnaBook[];
  isLoading: boolean;
  error: string | null;
  onTabChange: (tab: 'trending' | 'new' | 'picks' | 'recommended') => void;
  onViewAll: () => void;
  onSelectBook: (book: FinnaBook) => void;
  onAddToWishlist: (book: FinnaBook) => void;
  isInWishlist: (bookId: FinnaBook['id']) => boolean;
}

export function HomePopularSection({
  theme,
  currentTheme,
  activeTab,
  isAuthenticated,
  books,
  isLoading,
  error,
  onTabChange,
  onViewAll,
  onSelectBook,
  onAddToWishlist,
  isInWishlist,
}: HomePopularSectionProps) {
  const renderTabButton = (
    tab: HomePopularSectionProps['activeTab'],
    label: string,
    withIcon = false,
  ) => {
    const isActive = activeTab === tab;
    return (
      <button
        className={`px-4 md:px-6 py-3 ${
          isActive ? currentTheme.text : currentTheme.textMuted
        } hover:${currentTheme.text} transition-colors relative whitespace-nowrap flex items-center gap-2`}
        onClick={() => onTabChange(tab)}
      >
        {withIcon && <Sparkles className="w-4 h-4" />}
        {label}
        {isActive && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-0.5 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                : 'bg-blue-500'
            }`}
          />
        )}
      </button>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="col-span-4 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-4 text-center">
          <p className="text-red-500">Failed to load books. Please try again later.</p>
        </div>
      );
    }

    if (books.length === 0) {
      return (
        <div className="col-span-4 text-center">
          <p className="text-gray-500">No books found.</p>
        </div>
      );
    }

    return books.map((book) => {
      const bookInWishlist = isInWishlist(book.id);
      const isAvailableNow = book.buildings?.some((building) => building.available > 0);

      return (
        <BookCard
          key={book.id}
          image={book.imageUrl}
          title={book.title}
          onClick={() => onSelectBook(book)}
          shadow="raised"
          className="text-left"
          coverClassName="rounded-2xl"
          overlay={
            isAvailableNow ? (
              <Badge className="absolute top-3 right-3 bg-cyan-400 text-slate-900 hover:bg-cyan-400 text-xs px-3 py-1 rounded-full">
                Available Now
              </Badge>
            ) : null
          }
          footer={
            <Button
              variant="outline"
              disabled={bookInWishlist}
              className={`w-full ${
                theme === 'light'
                  ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-white hover:bg-slate-700/60 hover:border-slate-600'
              } text-sm py-2 rounded-lg flex items-center justify-center gap-2 ${
                bookInWishlist ? 'opacity-60 cursor-default hover:bg-transparent hover:border-transparent' : ''
              }`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!bookInWishlist) {
                  onAddToWishlist(book);
                }
              }}
            >
              <Star className="w-4 h-4" />
              <span>{bookInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
            </Button>
          }
        >
          <h3 className={`${currentTheme.text} text-sm line-clamp-2`}>{book.title}</h3>
          <p className={`${currentTheme.textMuted} text-xs`}>{book.author}</p>
        </BookCard>
      );
    });
  };

  return (
    <div className={`px-4 md:px-12 py-12 md:py-20 ${currentTheme.sectionBg2}`}>
      <h2 className={`${currentTheme.text} text-xl md:text-2xl mb-6 md:mb-10`}>Popular Now</h2>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="hidden md:flex flex-col items-center gap-6 min-w-[180px]">
          <div
            className={`p-5 rounded-full ${theme === 'light' ? 'bg-blue-100' : ''}`}
            style={theme === 'dark' ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' } : {}}
          >
            <Globe className={`w-16 h-16 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400/80'}`} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className={`${currentTheme.text} text-base mb-1`}>Vast Community</p>
            <p className={`${currentTheme.textMuted} text-sm`}>Growing daily</p>
          </div>
          <Button
            className={`${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } w-full rounded-full text-sm py-5 shadow-lg`}
            onClick={onViewAll}
          >
            View All Books
          </Button>
        </div>

        <div className="flex-1">
          <div className={`flex gap-2 md:gap-4 mb-6 md:mb-10 border-b ${currentTheme.border} overflow-x-auto scrollbar-hide`}>
            {renderTabButton('trending', 'Trending Now')}
            {renderTabButton('new', 'New Arrivals')}
            {renderTabButton('picks', 'Staff Picks')}
            {isAuthenticated && renderTabButton('recommended', 'For You', true)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
