import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Calendar,
  Clock,
  MapPin,
  Film,
  Sparkles,
  ChevronRight,
  Info,
  ShieldCheck,
  Star,
  Building2,
  CheckCircle2,
  Flame,
} from 'lucide-react';

const MovieShowsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState('All');

  // Generate next 4 calendar days using clean local date formatting
  const dateTabs = Array.from({ length: 4 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return {
      date: d,
      dateString,
      dayName:
        idx === 0
          ? 'Today'
          : idx === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const selectedDateObj = dateTabs[selectedDateIndex];

  useEffect(() => {
    const fetchMovieAndShows = async () => {
      try {
        setLoading(true);
        const [movieRes, showsRes] = await Promise.all([
          api.get(`/movie/${movieId}`),
          api.get(`/shows/movie/${movieId}?date=${selectedDateObj.dateString}&city=${encodeURIComponent(selectedCity)}`),
        ]);

        if (movieRes.data?.success) {
          setMovie(movieRes.data.movie);
        }
        if (showsRes.data?.success) {
          setShows(showsRes.data.shows || []);
        }
      } catch (err) {
        console.error('Failed to load shows:', err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieAndShows();
    }
  }, [movieId, selectedDateIndex, selectedCity]);

  // Extract unique cities available for filtering
  const availableCities = ['All', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Indore', 'Noida'];

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const key = show.theatreName;
    if (!acc[key]) {
      acc[key] = {
        theatreName: show.theatreName,
        location: show.theatreLocation || 'Prime Multiplex Center',
        city: show.city || 'National',
        shows: [],
      };
    }
    acc[key].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-20 pb-24">
      {/* Movie Mini Header */}
      <div className="bg-[#1a242f] border-b border-[#2a3b4c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {movie?.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.movieName}
                  className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg shadow-md border border-[#2a3b4c]"
                />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase text-white bg-[#00a8e1] px-1.5 py-0.5 rounded">
                    Prime
                  </span>
                  <span className="text-xs text-amber-400 font-bold flex items-center space-x-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{movie?.imdbRating || '7.8'}</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">{movie?.movieName}</h1>
                <p className="text-xs text-[#8197a4]">
                  {movie?.duration} • {movie?.genres?.join(', ')} • {movie?.certification || 'U/A 13+'} •{' '}
                  {movie?.language || 'English'}
                </p>
              </div>
            </div>

            <Link
              to={`/moviedetails/${movieId}`}
              className="text-xs text-[#00a8e1] hover:underline flex items-center space-x-1"
            >
              <span>View Film Overview</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Date Tabs */}
        <div>
          <label className="block text-xs uppercase font-bold text-[#8197a4] tracking-wider mb-3">
            Select Show Date
          </label>
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">
            {dateTabs.map((tab, idx) => {
              const isSelected = selectedDateIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center min-w-[5.2rem] px-4 py-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-cyanGlow scale-105'
                      : 'bg-[#1a242f] border-[#2a3b4c] text-[#8197a4] hover:text-white hover:border-[#8197a4]'
                  }`}
                >
                  <span className="text-[11px] uppercase font-bold tracking-wider">{tab.dayName}</span>
                  <span className="text-xl font-black my-0.5">{tab.dayNumber}</span>
                  <span className="text-[10px] uppercase font-semibold">{tab.monthName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-[#8197a4] font-semibold uppercase tracking-wider mr-1 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-[#00a8e1]" />
            <span>City:</span>
          </span>
          {availableCities.map((cityName) => {
            const isCitySelected = selectedCity === cityName;
            return (
              <button
                key={cityName}
                onClick={() => setSelectedCity(cityName)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  isCitySelected
                    ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-md'
                    : 'bg-[#1a242f] border-[#2a3b4c] text-[#8197a4] hover:text-white'
                }`}
              >
                {cityName}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#8197a4] bg-[#1a242f]/60 p-3.5 rounded-xl border border-[#2a3b4c]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Fast Filling</span>
            </span>
          </div>
          <span className="text-[11px] text-[#00a8e1] font-semibold">
            All auditoriums equipped with Tier-based seat selection & live lock
          </span>
        </div>

        {/* Theatres & Showtimes List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs text-[#8197a4]">Fetching live auditorium show schedules...</p>
          </div>
        ) : Object.keys(showsByTheatre).length === 0 ? (
          <div className="bg-[#1a242f] p-12 rounded-2xl border border-[#2a3b4c] text-center space-y-4">
            <Clock className="w-12 h-12 text-[#8197a4] mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-white">
              No Shows Scheduled for {selectedDateObj.dayName} {selectedCity !== 'All' ? `in ${selectedCity}` : ''}
            </h3>
            <p className="text-xs text-[#8197a4] max-w-sm mx-auto leading-relaxed">
              {selectedCity !== 'All'
                ? `There are currently no auditorium slots scheduled in ${selectedCity} for this date.`
                : 'Please choose another date or check back later as new auditorium slots are released daily.'}
            </p>
            {selectedCity !== 'All' && (
              <button
                onClick={() => setSelectedCity('All')}
                className="inline-flex items-center space-x-1 text-xs text-[#00a8e1] hover:underline font-bold mt-2"
              >
                <span>View All Cities</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(showsByTheatre).map((theatreGroup, tIdx) => (
              <div
                key={tIdx}
                className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl p-6 hover:border-[#00a8e1]/40 transition-colors shadow-lg space-y-5"
              >
                {/* Theatre Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2a3b4c]/70 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <span>{theatreGroup.theatreName}</span>
                      <span className="text-[10px] text-white bg-[#00a8e1] px-1.5 py-0.5 rounded font-bold uppercase">
                        Verified
                      </span>
                    </h3>
                    <p className="text-xs text-[#8197a4] flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00a8e1]" />
                      <span>{theatreGroup.location}</span>
                    </p>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-[#8197a4]">
                    <span className="bg-[#0f171e] px-2.5 py-1 rounded-md border border-[#2a3b4c]">
                      Dolby Atmos
                    </span>
                    <span className="bg-[#0f171e] px-2.5 py-1 rounded-md border border-[#2a3b4c]">
                      4K Laser
                    </span>
                    <span className="bg-[#0f171e] px-2.5 py-1 rounded-md border border-[#2a3b4c]">
                      Recliners
                    </span>
                  </div>
                </div>

                {/* Showtime Pills */}
                <div className="flex flex-wrap gap-3">
                  {theatreGroup.shows.map((show) => {
                    const isFast = show.isFastFilling;
                    const isSoldOut = show.isSoldOut;

                    return (
                      <button
                        key={show.showId || show._id}
                        disabled={isSoldOut}
                        onClick={() => navigate(`/seatslug/${show.showId || show._id}`)}
                        className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 min-w-[7.8rem] ${
                          isSoldOut
                            ? 'bg-[#0f171e]/50 border-red-900/30 opacity-40 cursor-not-allowed'
                            : 'border-[#2a3b4c] bg-[#0f171e] hover:border-[#00a8e1] hover:bg-[#00a8e1]/10 shadow-sm'
                        }`}
                      >
                        <span className="text-sm font-extrabold text-white group-hover:text-[#00a8e1] transition-colors">
                          {show.showTime}
                        </span>
                        <span className="text-[10px] text-[#8197a4] mt-0.5 font-medium">
                          {show.screenFormat || 'IMAX 4K Laser'}
                        </span>

                        <div className="flex items-center space-x-1 mt-1.5 text-[10px] font-semibold">
                          {isSoldOut ? (
                            <span className="text-red-400">Sold Out</span>
                          ) : isFast ? (
                            <span className="flex items-center space-x-1 text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Fast Filling</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Available</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieShowsPage;
