import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Ticket, Star, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import TrailerModal from './TrailerModal';

const MovieCard = ({ movie, isHorizontal = false }) => {
  const { isInWatchlist, toggleWatchlist, isAuthenticated } = useAuth();
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);

  const inWatchlist = isInWatchlist(movie._id);

  const handleWatchlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to save movies to your Watchlist.');
      return;
    }

    try {
      setIsUpdatingWatchlist(true);
      const res = await toggleWatchlist(movie._id);
      if (res?.action === 'added') {
        toast.success(`Added "${movie.movieName}" to Watchlist!`);
      } else {
        toast.info(`Removed "${movie.movieName}" from Watchlist.`);
      }
    } catch (err) {
      toast.error(err.message || 'Error updating watchlist');
    } finally {
      setIsUpdatingWatchlist(false);
    }
  };

  const handlePlayTrailer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTrailerOpen(true);
  };

  return (
    <>
      <div className="group relative flex-shrink-0 transition-all duration-300 ease-out prime-card-glow rounded-xl overflow-hidden bg-[#1a242f] border border-[#2a3b4c]/60">
        <Link
          to={`/moviedetails/${movie._id}`}
          className="block relative overflow-hidden"
        >
          {/* Card Image */}
          <div
            className={`relative overflow-hidden bg-[#0f171e] ${
              isHorizontal ? 'aspect-[16/9] w-72 sm:w-80' : 'aspect-[2/3] w-48 sm:w-56'
            }`}
          >
            <img
              src={isHorizontal ? (movie.backdropUrl || movie.posterUrl) : movie.posterUrl}
              alt={movie.movieName}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a242f] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

            {/* Top Prime Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#00a8e1] px-1.5 py-0.5 rounded shadow">
                Prime
              </span>
              <span className="text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
                4K UHD
              </span>
            </div>

            {/* Top Rating */}
            <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400 font-bold text-xs shadow">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{movie.imdbRating || 8.5}</span>
            </div>
          </div>

          {/* Card Info Details */}
          <div className="p-3 sm:p-4 bg-[#1a242f]">
            <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-[#00a8e1] transition-colors">
              {movie.movieName}
            </h3>

            <div className="flex items-center space-x-2 text-[11px] text-[#8197a4] mt-1 truncate">
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="truncate">{movie.genres?.slice(0, 2).join(', ')}</span>
              <span>•</span>
              <span className="border border-[#2a3b4c] px-1 rounded text-[10px] text-white/80">
                {movie.certification || 'U/A'}
              </span>
            </div>

            {/* Action Buttons on Card */}
            <div className="mt-3 pt-3 border-t border-[#2a3b4c]/70 flex items-center justify-between gap-2">
              <Link
                to={`/movieshows/${movie._id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-1.5 px-3 rounded-lg text-xs font-semibold shadow transition-all duration-200 hover:shadow-cyanGlow"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Book</span>
              </Link>

              <button
                type="button"
                onClick={handlePlayTrailer}
                title="Watch Trailer"
                className="p-1.5 bg-[#253342] hover:bg-[#00a8e1] text-white rounded-lg transition-colors border border-[#2a3b4c]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleWatchlistClick}
                disabled={isUpdatingWatchlist}
                title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                className={`p-1.5 rounded-lg transition-colors border ${
                  inWatchlist
                    ? 'bg-[#00a8e1]/20 border-[#00a8e1] text-[#00a8e1]'
                    : 'bg-[#253342] hover:bg-[#2a3b4c] text-white border-[#2a3b4c]'
                }`}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </Link>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieName={movie.movieName}
      />
    </>
  );
};

export default MovieCard;
