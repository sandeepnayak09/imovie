import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Film, Ticket, Sparkles } from 'lucide-react';
import MovieCard from '../components/MovieCard';

const WatchlistPage = () => {
  const { user, watchlist } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlistMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/favorite?email=${encodeURIComponent(user?.email || '')}`);
      if (res.data?.success) {
        setMovies(res.data.movies || []);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchWatchlistMovies();
    }
  }, [user, watchlist]);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#2a3b4c] gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black text-white bg-[#00a8e1] px-2 py-0.5 rounded">
                Personalized
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Watchlist
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#8197a4] mt-1">
              Your saved films to track and book when showtimes are announced
            </p>
          </div>

          <Link
            to="/home"
            className="self-start sm:self-auto flex items-center space-x-2 bg-[#1a242f] hover:bg-[#253342] text-white border border-[#2a3b4c] px-4 py-2 rounded-xl font-semibold text-xs transition-colors"
          >
            <span>Explore More Titles</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
              Loading Watchlist...
            </p>
          </div>
        ) : movies.length === 0 ? (
          <div className="bg-[#1a242f] border border-[#2a3b4c] rounded-3xl p-12 text-center space-y-4 my-8">
            <Bookmark className="w-16 h-16 text-[#8197a4] mx-auto opacity-50" />
            <h3 className="text-xl font-bold text-white">Your Watchlist is Empty</h3>
            <p className="text-xs sm:text-sm text-[#8197a4] max-w-md mx-auto">
              Click the "+" icon on any movie card or detail page to save titles here for quick access.
            </p>
            <Link
              to="/home"
              className="inline-block bg-[#00a8e1] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-cyanGlow transition-all"
            >
              Discover Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
