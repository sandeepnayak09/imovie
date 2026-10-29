import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { Calendar, ChevronLeft, Plus, Film, Building, Clock } from 'lucide-react';

const AddShowPage = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreName, setSelectedTheatreName] = useState('');
  const [showDate, setShowDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showTime, setShowTime] = useState('06:45 PM');
  const [screenFormat, setScreenFormat] = useState('IMAX 4K Laser');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesRes, theatresRes] = await Promise.all([
          api.get('/movie'),
          api.get('/theatre'),
        ]);

        if (moviesRes.data?.success && moviesRes.data.movies.length > 0) {
          setMovies(moviesRes.data.movies);
          setSelectedMovieId(moviesRes.data.movies[0]._id);
        }

        if (theatresRes.data?.success && theatresRes.data.theatres.length > 0) {
          setTheatres(theatresRes.data.theatres);
          setSelectedTheatreName(theatresRes.data.theatres[0].theatreName);
        }
      } catch (err) {
        console.error('Failed to load movies/theatres for show scheduling:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMovieId || !selectedTheatreName || !showDate || !showTime) {
      toast.error('Please complete all show scheduling fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/shows', {
        movieId: selectedMovieId,
        theatreName: selectedTheatreName,
        showDate,
        showTime,
        screenFormat,
      });

      if (res.data?.success) {
        toast.success('Show scheduled and ticket seat matrix generated!');
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule show.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 mb-8 border-b border-[#2a3b4c]">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-[#1a242f] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Schedule Auditorium Show</h1>
            <p className="text-xs text-[#8197a4] mt-0.5">
              Link a catalog title to an auditorium venue with custom showtimes
            </p>
          </div>
        </div>

        {/* Form Card */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs text-[#8197a4]">Loading catalog & venues...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-5">
              {/* Select Movie */}
              <div>
                <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <Film className="w-3.5 h-3.5 text-[#00a8e1]" />
                  <span>Feature Film *</span>
                </label>
                <select
                  required
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.movieName} ({m.duration} • {m.certification} • {m.language})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Theatre */}
              <div>
                <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>Theatre Venue *</span>
                </label>
                <select
                  required
                  value={selectedTheatreName}
                  onChange={(e) => setSelectedTheatreName(e.target.value)}
                  className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t.theatreName}>
                      {t.theatreName} — {t.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Showtime *</span>
                  </label>
                  <select
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                    className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                  >
                    <option value="09:30 AM">09:30 AM (Morning Special)</option>
                    <option value="12:45 PM">12:45 PM (Matinee)</option>
                    <option value="04:15 PM">04:15 PM (Evening)</option>
                    <option value="06:45 PM">06:45 PM (Prime Time)</option>
                    <option value="09:30 PM">09:30 PM (Night Gala)</option>
                    <option value="11:15 PM">11:15 PM (Late Night Screening)</option>
                  </select>
                </div>
              </div>

              {/* Screen Format */}
              <div>
                <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                  Screen Presentation Format
                </label>
                <select
                  value={screenFormat}
                  onChange={(e) => setScreenFormat(e.target.value)}
                  className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                >
                  <option value="IMAX 4K Laser">IMAX 4K Laser Experience</option>
                  <option value="Dolby Atmos 7.1">Dolby Atmos 7.1 Surround</option>
                  <option value="RealD 3D">RealD 3D Immersive</option>
                  <option value="4DX Experience">4DX Motion & Atmospheric FX</option>
                  <option value="Standard 2D">Standard Digital 2D</option>
                </select>
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
                <span>{isSubmitting ? 'Scheduling Show...' : 'Schedule Show & Build Seats'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddShowPage;
