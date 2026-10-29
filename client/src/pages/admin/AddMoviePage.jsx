import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { Film, ChevronLeft, Sparkles, Plus, Image } from 'lucide-react';

const AddMoviePage = () => {
  const navigate = useNavigate();

  const [movieName, setMovieName] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('Action, Sci-Fi, Thriller');
  const [releaseDate, setReleaseDate] = useState('2024-12-20');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('2h 35m');
  const [certification, setCertification] = useState('U/A 16+');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('https://www.youtube.com/embed/Way9Dexny3w');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [imdbRating, setImdbRating] = useState('8.5');
  const [featured, setFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFillSample = () => {
    setMovieName('Mission: Impossible – The Final Reckoning');
    setDescription(
      'Our lives are the sum of our choices. Ethan Hunt and his IMF team face their most dangerous mission yet as rogue artificial intelligence threatens to dismantle global security.'
    );
    setGenres('Action, Adventure, Thriller');
    setReleaseDate('2025-05-23');
    setLanguage('English');
    setDuration('2h 45m');
    setCertification('U/A 16+');
    setPosterUrl('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80');
    setBackdropUrl('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80');
    setTrailerUrl('https://www.youtube.com/embed/fsQgc9pCyDU');
    setDirector('Christopher McQuarrie');
    setCast('Tom Cruise, Hayley Atwell, Ving Rhames, Simon Pegg, Vanessa Kirby');
    setImdbRating('8.8');
    setFeatured(true);
    toast.info('Sample blockbuster details filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!movieName || !description || !genres || !releaseDate || !language || !duration) {
      toast.error('Please complete all mandatory movie attributes.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/movie', {
        movieName,
        description,
        genres: genres.split(',').map((g) => g.trim()),
        releaseDate,
        language,
        duration,
        certification,
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
        trailerUrl,
        director: director || 'Visionary Director',
        cast: cast ? cast.split(',').map((c) => c.trim()) : ['Starring Actor'],
        imdbRating: Number(imdbRating) || 8.0,
        featured,
      });

      if (res.data?.success) {
        toast.success(`"${movieName}" published to iMovies catalog!`);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add movie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#2a3b4c]">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-[#1a242f] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Add New Movie</h1>
              <p className="text-xs text-[#8197a4] mt-0.5">Register a film in the database with rich Amazon Prime metadata</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            className="flex items-center space-x-1.5 bg-[#00a8e1]/10 text-[#00a8e1] border border-[#00a8e1]/30 hover:bg-[#00a8e1]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Sample Data</span>
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Movie Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Movie Title *
              </label>
              <input
                type="text"
                required
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                placeholder="e.g. Oppenheimer"
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Overview / Synopsis *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed plot synopsis..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Genres (Comma-separated) *
              </label>
              <input
                type="text"
                required
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Action, Sci-Fi, Thriller"
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Language *
              </label>
              <input
                type="text"
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English, Hindi, etc."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Release Date */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Release Date *
              </label>
              <input
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Runtime Duration *
              </label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2h 45m"
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Certification */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Certification
              </label>
              <select
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              >
                <option value="U">U (Universal)</option>
                <option value="U/A 13+">U/A 13+</option>
                <option value="U/A 16+">U/A 16+</option>
                <option value="A 18+">A 18+ (Adults Only)</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R (Restricted)</option>
              </select>
            </div>

            {/* IMDb Rating */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                IMDb Rating (0-10)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={imdbRating}
                onChange={(e) => setImdbRating(e.target.value)}
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Poster URL */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Vertical Poster URL
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Backdrop URL */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Widescreen Backdrop URL (16:9)
              </label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Trailer URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                YouTube Trailer Embed URL
              </label>
              <input
                type="url"
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Director */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Director
              </label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Christopher Nolan"
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Cast */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Lead Cast (Comma-separated)
              </label>
              <input
                type="text"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                placeholder="Actor 1, Actor 2, Actor 3"
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Featured toggle */}
            <div className="sm:col-span-2 flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-[#00a8e1] rounded bg-[#0f171e] border-[#2a3b4c] focus:ring-[#00a8e1]"
              />
              <label htmlFor="featured" className="text-xs font-semibold text-white cursor-pointer">
                Feature in Amazon Prime Hero Carousel Banner
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#2a3b4c] flex justify-end space-x-3">
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl bg-[#0f171e] hover:bg-[#253342] text-xs font-bold text-gray-300 border border-[#2a3b4c] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-7 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-cyanGlow transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Movie...' : 'Save & Publish Movie'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMoviePage;
