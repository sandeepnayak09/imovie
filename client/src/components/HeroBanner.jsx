import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Ticket, Plus, Check, Star, Info, Volume2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import TrailerModal from './TrailerModal';

const HeroBanner = ({ featuredMovies = [] }) => {
  const { isInWatchlist, toggleWatchlist, isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Auto-advance banner every 7 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  if (!featuredMovies || featuredMovies.length === 0) return null;

  const currentMovie = featuredMovies[currentIndex] || featuredMovies[0];
  const inWatchlist = isInWatchlist(currentMovie._id);

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add movies to your Watchlist.');
      return;
    }
    try {
      const res = await toggleWatchlist(currentMovie._id);
      if (res?.action === 'added') {
        toast.success(`Added "${currentMovie.movieName}" to Watchlist!`);
      } else {
        toast.info(`Removed "${currentMovie.movieName}" from Watchlist.`);
      }
    } catch (err) {
      toast.error(err.message || 'Error updating watchlist');
    }
  };

  return (
    <>
      <div className="relative w-full h-[70vh] sm:h-[82vh] lg:h-[88vh] overflow-hidden bg-[#0f171e]">
        {/* Backdrop Image with Transitions */}
        <div className="absolute inset-0">
          <img
            key={currentMovie._id}
            src={currentMovie.backdropUrl || currentMovie.posterUrl}
            alt={currentMovie.movieName}
            className="w-full h-full object-cover object-center animate-fade-in transition-all duration-1000 scale-100"
          />

          {/* Gradients to seamlessly blend into Prime dark theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/85 sm:via-[#0f171e]/70 to-transparent w-full sm:w-3/4"></div>
        </div>

        {/* Banner Content Container */}
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24 z-10">
          <div className="max-w-2xl space-y-4">
            {/* Prime Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-white bg-[#00a8e1] px-2.5 py-0.5 rounded shadow">
                Prime Exclusive
              </span>
              <span className="text-xs font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20">
                4K UHD
              </span>
              <span className="text-xs font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20">
                Dolby Atmos
              </span>
              <div className="flex items-center space-x-1 bg-black/70 px-2 py-0.5 rounded-md border border-amber-500/40 text-amber-400 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{currentMovie.imdbRating || 8.5} IMDb</span>
              </div>
            </div>

            {/* Movie Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
              {currentMovie.movieName}
            </h1>

            {/* Metadata Line */}
            <div className="flex items-center space-x-3 text-xs sm:text-sm text-[#8197a4] font-medium">
              <span className="text-white font-semibold">{currentMovie.duration}</span>
              <span>•</span>
              <span>{currentMovie.genres?.join(', ')}</span>
              <span>•</span>
              <span className="border border-[#2a3b4c] text-white/80 px-1.5 py-0.5 rounded text-[11px]">
                {currentMovie.certification || 'U/A 16+'}
              </span>
              <span>•</span>
              <span>{currentMovie.language}</span>
            </div>

            {/* Synopsis */}
            <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed max-w-xl">
              {currentMovie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/movieshows/${currentMovie._id}`}
                className="flex items-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-6 py-3 rounded-lg font-bold text-sm sm:text-base shadow-lg transition-all duration-200 hover:shadow-cyanGlow"
              >
                <Ticket className="w-5 h-5" />
                <span>Book Tickets</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-5 py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Trailer</span>
              </button>

              <button
                type="button"
                onClick={handleWatchlistClick}
                title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                className={`p-3 rounded-lg transition-colors border backdrop-blur-md ${
                  inWatchlist
                    ? 'bg-[#00a8e1]/30 border-[#00a8e1] text-[#00a8e1]'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>

              <Link
                to={`/moviedetails/${currentMovie._id}`}
                title="More Details"
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 backdrop-blur-md"
              >
                <Info className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators / Controls */}
        {featuredMovies.length > 1 && (
          <div className="absolute bottom-6 right-4 sm:right-8 z-20 flex items-center space-x-2">
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length)
              }
              aria-label="Previous slide"
              className="p-1.5 rounded-full bg-black/60 hover:bg-[#00a8e1] text-white backdrop-blur-sm transition-colors border border-[#2a3b4c]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {featuredMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-6 bg-[#00a8e1]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
              aria-label="Next slide"
              className="p-1.5 rounded-full bg-black/60 hover:bg-[#00a8e1] text-white backdrop-blur-sm transition-colors border border-[#2a3b4c]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={currentMovie.trailerUrl}
        movieName={currentMovie.movieName}
      />
    </>
  );
};

export default HeroBanner;
