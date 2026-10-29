import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import HeroBanner from '../components/HeroBanner';
import MovieCarousel from '../components/MovieCarousel';
import MovieCard from '../components/MovieCard';
import { Film, Filter, Search, Sparkles } from 'lucide-react';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Biography', 'Animation', 'Thriller'];
const LANGUAGES = ['All', 'English', 'Hindi', 'Spanish'];

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Fetch movies on mount or when filter changes
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        let url = '/movie?';
        if (selectedGenre !== 'All') url += `genre=${encodeURIComponent(selectedGenre)}&`;
        if (selectedLanguage !== 'All') url += `language=${encodeURIComponent(selectedLanguage)}&`;
        if (searchParam) url += `search=${encodeURIComponent(searchParam)}&`;

        const res = await api.get(url);
        if (res.data?.success) {
          setMovies(res.data.movies);
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedGenre, selectedLanguage, searchParam]);

  // Featured banner movies
  const featuredList = movies.filter((m) => m.featured || m.imdbRating >= 8.7).slice(0, 5);

  // Categorized movies for Amazon Prime carousel rows
  const trendingMovies = [...movies].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
  const scifiMovies = movies.filter((m) => m.genres?.some((g) => g.toLowerCase().includes('sci-fi')));
  const actionMovies = movies.filter((m) => m.genres?.some((g) => g.toLowerCase().includes('action')));
  const dramaMovies = movies.filter((m) => m.genres?.some((g) => g.toLowerCase().includes('drama') || g.toLowerCase().includes('biography')));

  const isFiltering = selectedGenre !== 'All' || selectedLanguage !== 'All' || Boolean(searchParam);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white">
      {/* Prime Hero Banner (only on unfiltered view) */}
      {!isFiltering && featuredList.length > 0 && (
        <HeroBanner featuredMovies={featuredList} />
      )}

      {/* Main Content Area */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isFiltering ? 'pt-24 sm:pt-28' : '-mt-16 sm:-mt-24 relative z-30'}`}>
        {/* Filter Pills Bar */}
        <div className="bg-[#1a242f]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#2a3b4c] shadow-2xl mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Genre Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-[#8197a4] uppercase tracking-wider flex items-center space-x-1 mr-2 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#00a8e1]" />
                <span>Genres:</span>
              </span>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                    selectedGenre === genre
                      ? 'bg-[#00a8e1] text-white shadow-cyanGlow'
                      : 'bg-[#0f171e] text-[#8197a4] hover:text-white border border-[#2a3b4c]'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Language Dropdown / Pills */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-xs font-bold text-[#8197a4] uppercase tracking-wider">
                Language:
              </span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#0f171e] text-white text-xs px-3 py-1.5 rounded-lg border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              {isFiltering && (
                <button
                  onClick={() => {
                    setSelectedGenre('All');
                    setSelectedLanguage('All');
                    setSearchParams({});
                  }}
                  className="text-xs text-[#00a8e1] hover:underline font-semibold ml-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {searchParam && (
            <div className="flex items-center justify-between text-xs text-[#8197a4] pt-2 border-t border-[#2a3b4c]/60">
              <span>
                Showing results matching: <strong className="text-white">"{searchParam}"</strong>
              </span>
              <button
                onClick={() => setSearchParams({})}
                className="text-[#00a8e1] hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
              Streaming Prime catalog...
            </p>
          </div>
        )}

        {/* Filtered Grid or Carousel Rows */}
        {!loading && (
          <>
            {isFiltering ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">
                    {searchParam ? `Search Results (${movies.length})` : `${selectedGenre} Movies (${movies.length})`}
                  </h2>
                  <p className="text-xs text-[#8197a4] mt-1">Select a film to explore auditoriums, showtimes, and book recliners</p>
                </div>

                {movies.length === 0 ? (
                  <div className="bg-[#1a242f] border border-[#2a3b4c] p-12 rounded-2xl text-center space-y-4 my-8">
                    <Film className="w-12 h-12 text-[#8197a4] mx-auto opacity-50" />
                    <h3 className="text-lg font-bold text-white">No movies found</h3>
                    <p className="text-xs text-[#8197a4] max-w-sm mx-auto">
                      We couldn't find any titles matching your selected filters. Try choosing a different genre or clearing the search query.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedGenre('All');
                        setSelectedLanguage('All');
                        setSearchParams({});
                      }}
                      className="bg-[#00a8e1] text-white px-5 py-2 rounded-lg text-xs font-bold"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {movies.map((movie) => (
                      <MovieCard key={movie._id} movie={movie} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Carousel 1: Trending Now */}
                <MovieCarousel
                  title="Trending Now on Prime"
                  subtitle="Top picks loved by audiences across the nation"
                  movies={trendingMovies}
                  isHorizontal={true}
                />

                {/* Carousel 2: Sci-Fi & Fantasy */}
                {scifiMovies.length > 0 && (
                  <MovieCarousel
                    title="Sci-Fi & Spectacle"
                    subtitle="Visionary worlds, mind-bending concepts, and IMAX visuals"
                    movies={scifiMovies}
                    isHorizontal={false}
                  />
                )}

                {/* Carousel 3: Action & Adventure */}
                {actionMovies.length > 0 && (
                  <MovieCarousel
                    title="Action & High Stakes"
                    subtitle="Adrenaline-pumping thrillers and colossal showdowns"
                    movies={actionMovies}
                    isHorizontal={true}
                  />
                )}

                {/* Carousel 4: Drama & Acclaimed */}
                {dramaMovies.length > 0 && (
                  <MovieCarousel
                    title="Critically Acclaimed Dramas"
                    subtitle="Award-winning narratives and captivating storytelling"
                    movies={dramaMovies}
                    isHorizontal={false}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
