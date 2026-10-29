import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Ticket,
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Calendar,
  Globe,
  Film,
  MessageSquare,
  Send,
  User,
  ShieldCheck,
} from 'lucide-react';
import TrailerModal from '../components/TrailerModal';

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const { user, isAuthenticated, isInWatchlist, toggleWatchlist } = useAuth();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const inWatchlist = movie ? isInWatchlist(movie._id) : false;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const [movieRes, reviewsRes] = await Promise.all([
          api.get(`/movie/${movieId}`),
          api.get(`/review/${movieId}`),
        ]);

        if (movieRes.data?.success) {
          setMovie(movieRes.data.movie);
        }
        if (reviewsRes.data?.success) {
          setReviews(reviewsRes.data.reviews);
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        toast.error('Error loading movie details.');
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const handleWatchlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add movies to your Watchlist.');
      return;
    }
    try {
      const res = await toggleWatchlist(movie._id);
      if (res?.action === 'added') {
        toast.success(`"${movie.movieName}" added to Watchlist!`);
      } else {
        toast.info(`"${movie.movieName}" removed from Watchlist.`);
      }
    } catch (err) {
      toast.error(err.message || 'Error updating watchlist.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to post a review.');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review comment.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/review', {
        movieId: movie._id,
        rating,
        reviewText: reviewText.trim(),
        userEmail: user.email,
        username: user.username,
      });

      if (res.data?.success) {
        toast.success('Review posted successfully!');
        setReviews([res.data.review, ...reviews]);
        setReviewText('');
        setRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
          Loading Cinematic Experience...
        </p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center text-center p-6 pt-24">
        <Film className="w-16 h-16 text-[#8197a4] opacity-50 mb-4" />
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-sm text-[#8197a4] mt-2 mb-6">The requested movie could not be located in our catalog.</p>
        <Link to="/home" className="bg-[#00a8e1] text-white px-6 py-2.5 rounded-lg text-sm font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '2024';

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20">
      {/* Cinematic Hero Backdrop */}
      <div className="relative w-full h-[65vh] sm:h-[75vh] overflow-hidden">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.movieName}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/70 to-[#0f171e]/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/85 to-transparent w-full sm:w-2/3"></div>

        {/* Hero Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 z-10">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-white bg-[#00a8e1] px-2.5 py-0.5 rounded shadow">
                Prime In Theatres
              </span>
              <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded border border-white/20">
                4K UHD
              </span>
              <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded border border-white/20">
                Dolby 5.1
              </span>
              <div className="flex items-center space-x-1 bg-black/70 px-2 py-0.5 rounded-md border border-amber-500/40 text-amber-400 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{movie.imdbRating || 8.5} IMDb</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {movie.movieName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#8197a4]">
              <span className="text-white font-semibold">{releaseYear}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="border border-[#2a3b4c] text-white/90 px-1.5 py-0.5 rounded text-[11px]">
                {movie.certification || 'U/A 16+'}
              </span>
              <span>•</span>
              <span>{movie.language}</span>
              <span>•</span>
              <span className="text-[#00a8e1] font-medium">{movie.genres?.join(', ')}</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/movieshows/${movie._id}`}
                className="flex items-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-cyanGlow transition-all duration-200"
              >
                <Ticket className="w-5 h-5" />
                <span>Book Tickets Now</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Trailer</span>
              </button>

              <button
                type="button"
                onClick={handleWatchlist}
                className={`p-3.5 rounded-xl transition-colors border backdrop-blur-md ${
                  inWatchlist
                    ? 'bg-[#00a8e1]/30 border-[#00a8e1] text-[#00a8e1]'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Reviews Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Synopsis, Cast, Director */}
        <div className="lg:col-span-2 space-y-8">
          {/* Synopsis */}
          <div className="bg-[#1a242f] p-6 sm:p-8 rounded-2xl border border-[#2a3b4c]">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center space-x-2">
              <span>Overview & Storyline</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {movie.description}
            </p>
          </div>

          {/* Cast & Crew */}
          <div className="bg-[#1a242f] p-6 sm:p-8 rounded-2xl border border-[#2a3b4c] space-y-6">
            <h2 className="text-xl font-bold text-white">Cast & Creative Team</h2>

            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#8197a4] mb-2">Director</p>
              <div className="inline-flex items-center space-x-2 bg-[#0f171e] px-4 py-2 rounded-xl border border-[#2a3b4c]">
                <Film className="w-4 h-4 text-[#00a8e1]" />
                <span className="font-semibold text-sm text-white">{movie.director}</span>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#8197a4] mb-3">Starring Cast</p>
              <div className="flex flex-wrap gap-2.5">
                {movie.cast?.map((actor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-[#0f171e] px-3.5 py-2 rounded-xl border border-[#2a3b4c] hover:border-[#00a8e1]/60 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#00a8e1]/20 text-[#00a8e1] flex items-center justify-center font-bold text-xs">
                      {actor.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-white">{actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="bg-[#1a242f] p-6 sm:p-8 rounded-2xl border border-[#2a3b4c] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Audience Reviews</h2>
                <p className="text-xs text-[#8197a4] mt-0.5">
                  Verified feedback from patrons who watched in auditoriums
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#0f171e] px-3 py-1.5 rounded-xl border border-[#2a3b4c]">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-white">
                  {reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : movie.imdbRating || 8.5}
                </span>
                <span className="text-xs text-[#8197a4]">({reviews.length})</span>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-[#0f171e] p-4 sm:p-5 rounded-xl border border-[#2a3b4c] space-y-4">
              <h3 className="text-sm font-bold text-white">Share Your Review</h3>

              {/* Star selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#8197a4]">Your Rating:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#2a3b4c] hover:text-amber-400/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
              </div>

              <textarea
                rows={3}
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was the movie? Mention performance, visuals, sound design..."
                className="w-full bg-[#1a242f] text-white text-xs sm:text-sm p-3 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center space-x-1.5 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-5 py-2 rounded-lg text-xs font-bold shadow transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Posting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>

            {/* Review List */}
            <div className="space-y-3 pt-2">
              {reviews.length === 0 ? (
                <p className="text-xs text-[#8197a4] text-center py-6">
                  No reviews yet. Be the first to share your thoughts on this blockbuster!
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="bg-[#0f171e]/70 p-4 rounded-xl border border-[#2a3b4c]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-[#253342] text-[#00a8e1] font-bold text-xs flex items-center justify-center">
                          {rev.username ? rev.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rev.username || rev.userEmail}</p>
                          <p className="text-[10px] text-[#8197a4]">
                            {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-[#2a3b4c]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {rev.reviewText}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Poster Card & Booking Shortcut */}
        <div className="space-y-6">
          <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2a3b4c] space-y-5 sticky top-24">
            <img
              src={movie.posterUrl}
              alt={movie.movieName}
              className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-[#2a3b4c]"
            />

            <Link
              to={`/movieshows/${movie._id}`}
              className="w-full flex items-center justify-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3.5 rounded-xl font-extrabold text-sm shadow-xl hover:shadow-cyanGlow transition-all duration-200"
            >
              <Ticket className="w-4 h-4" />
              <span>Select Showtimes & Seats</span>
            </Link>

            <div className="pt-2 border-t border-[#2a3b4c] space-y-2.5 text-xs text-[#8197a4]">
              <div className="flex justify-between">
                <span>Release Status:</span>
                <span className="text-emerald-400 font-semibold">Now Showing</span>
              </div>
              <div className="flex justify-between">
                <span>IMDb Score:</span>
                <span className="text-amber-400 font-bold">{movie.imdbRating} / 10</span>
              </div>
              <div className="flex justify-between">
                <span>Audio Support:</span>
                <span className="text-white">Dolby Atmos, 7.1 Surround</span>
              </div>
              <div className="flex justify-between">
                <span>Screen Formats:</span>
                <span className="text-white">IMAX 4K Laser, 2D, 3D</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieName={movie.movieName}
      />
    </div>
  );
};

export default MovieDetailsPage;
