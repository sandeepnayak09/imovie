const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'f9e6f30f4548a45cc24820d273e12ec9';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// TMDB Genre ID to Name Dictionary
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Language Code to Name
const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  de: 'German',
  it: 'Italian',
  te: 'Telugu',
  ta: 'Tamil',
  zh: 'Mandarin',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
};

// In-Memory Cache with TTL
const cache = {
  catalog: null,
  catalogTimestamp: 0,
  details: new Map(),
  TTL_MS: 10 * 60 * 1000, // 10 minutes
};

// Axios instance configured for TMDB API
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  params: {
    api_key: TMDB_API_KEY,
  },
});

/**
 * Format a raw TMDB movie object into the iMovies standard schema
 */
const formatTmdbMovie = (tmdbMovie, details = null, index = 0) => {
  if (!tmdbMovie) return null;

  // Extract genres
  let genres = ['Action', 'Thriller'];
  if (details?.genres && details.genres.length > 0) {
    genres = details.genres.map((g) => g.name);
  } else if (tmdbMovie.genre_ids && tmdbMovie.genre_ids.length > 0) {
    genres = tmdbMovie.genre_ids.map((id) => GENRE_MAP[id] || 'Cinema').filter(Boolean);
  }

  // Extract poster & backdrop
  const posterUrl = tmdbMovie.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${tmdbMovie.poster_path}`
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';

  const backdropUrl = tmdbMovie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/original${tmdbMovie.backdrop_path}`
    : tmdbMovie.poster_path
    ? `${TMDB_IMAGE_BASE}/original${tmdbMovie.poster_path}`
    : 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80';

  // Format runtime
  let duration = '2h 15m';
  if (details?.runtime) {
    const hours = Math.floor(details.runtime / 60);
    const mins = details.runtime % 60;
    duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // Format Trailer URL
  let trailerUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  if (details?.videos?.results && details.videos.results.length > 0) {
    const youtubeTrailers = details.videos.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const chosenTrailer = youtubeTrailers[0] || details.videos.results[0];
    if (chosenTrailer?.key) {
      trailerUrl = `https://www.youtube.com/embed/${chosenTrailer.key}`;
    }
  }

  // Format Director & Cast
  let director = 'Acclaimed Director';
  let cast = ['Lead Actor', 'Supporting Cast'];

  if (details?.credits) {
    const dir = details.credits.crew?.find((c) => c.job === 'Director');
    if (dir?.name) director = dir.name;

    if (details.credits.cast && details.credits.cast.length > 0) {
      cast = details.credits.cast.slice(0, 5).map((c) => c.name);
    }
  }

  // Rating
  const imdbRating = tmdbMovie.vote_average
    ? Number(tmdbMovie.vote_average.toFixed(1))
    : 8.2;

  // Language name
  const langCode = (tmdbMovie.original_language || 'en').toLowerCase();
  const language = LANGUAGE_MAP[langCode] || langCode.toUpperCase();

  // Certification badge
  let certification = 'U/A 16+';
  if (tmdbMovie.adult) {
    certification = 'A 18+';
  } else if (imdbRating >= 8.5) {
    certification = 'U/A 16+';
  } else if (genres.includes('Animation') || genres.includes('Family')) {
    certification = 'U';
  } else {
    certification = 'U/A 13+';
  }

  return {
    _id: String(tmdbMovie.id),
    tmdbId: tmdbMovie.id,
    movieName: tmdbMovie.title || tmdbMovie.original_title || 'Untitled Film',
    description:
      tmdbMovie.overview ||
      details?.overview ||
      'An electrifying blockbuster movie experience now screening in premium auditoriums with Dolby Atmos.',
    genres: genres.length > 0 ? genres : ['Action', 'Spectacle'],
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : new Date(),
    language,
    duration,
    certification,
    posterUrl,
    backdropUrl,
    trailerUrl,
    director,
    cast,
    imdbRating,
    voteCount: tmdbMovie.vote_count || 100,
    popularity: tmdbMovie.popularity || 50,
    featured: index < 5 || imdbRating >= 8.3,
    createdAt: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : new Date(),
  };
};

/**
 * Fetch Now Playing Movies from TMDB
 */
const getNowPlayingMovies = async (page = 1) => {
  try {
    const response = await tmdbClient.get('/movie/now_playing', {
      params: { page, language: 'en-US' },
    });
    return response.data?.results || [];
  } catch (error) {
    console.error('TMDB Now Playing error:', error.message);
    return [];
  }
};

/**
 * Fetch Popular Movies from TMDB
 */
const getPopularMovies = async (page = 1) => {
  try {
    const response = await tmdbClient.get('/movie/popular', {
      params: { page, language: 'en-US' },
    });
    return response.data?.results || [];
  } catch (error) {
    console.error('TMDB Popular error:', error.message);
    return [];
  }
};

/**
 * Fetch Upcoming Movies from TMDB
 */
const getUpcomingMovies = async (page = 1) => {
  try {
    const response = await tmdbClient.get('/movie/upcoming', {
      params: { page, language: 'en-US' },
    });
    return response.data?.results || [];
  } catch (error) {
    console.error('TMDB Upcoming error:', error.message);
    return [];
  }
};

/**
 * Search Movies dynamically from TMDB
 */
const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) return [];
  try {
    const response = await tmdbClient.get('/search/movie', {
      params: {
        query: query.trim(),
        page,
        include_adult: false,
        language: 'en-US',
      },
    });

    const rawList = response.data?.results || [];
    return rawList.map((m, idx) => formatTmdbMovie(m, null, idx));
  } catch (error) {
    console.error('TMDB Search error:', error.message);
    return [];
  }
};

/**
 * Fetch full movie details with trailers and cast credits
 */
const getMovieDetails = async (movieId) => {
  if (!movieId) return null;

  // Check cache
  const cached = cache.details.get(String(movieId));
  if (cached && Date.now() - cached.timestamp < cache.TTL_MS) {
    return cached.data;
  }

  try {
    const response = await tmdbClient.get(`/movie/${movieId}`, {
      params: {
        append_to_response: 'videos,credits',
        language: 'en-US',
      },
    });

    const formatted = formatTmdbMovie(response.data, response.data, 0);

    // Save in cache
    cache.details.set(String(movieId), {
      data: formatted,
      timestamp: Date.now(),
    });

    return formatted;
  } catch (error) {
    console.error(`TMDB details error for movie ${movieId}:`, error.message);
    return null;
  }
};

/**
 * Get aggregated real-time market movie catalog (Now Playing + Popular)
 */
const getLiveMarketCatalog = async () => {
  const now = Date.now();

  // Return cached catalog if fresh
  if (cache.catalog && now - cache.catalogTimestamp < cache.TTL_MS) {
    return cache.catalog;
  }

  try {
    // Fetch now_playing and popular in parallel
    const [nowPlayingList, popularList, upcomingList] = await Promise.all([
      getNowPlayingMovies(1),
      getPopularMovies(1),
      getUpcomingMovies(1),
    ]);

    // Deduplicate by movie ID
    const movieMap = new Map();

    // Now Playing first
    nowPlayingList.forEach((m) => {
      if (m && m.id && m.poster_path) {
        movieMap.set(m.id, m);
      }
    });

    // Add Popular
    popularList.forEach((m) => {
      if (m && m.id && m.poster_path && !movieMap.has(m.id)) {
        movieMap.set(m.id, m);
      }
    });

    // Add Upcoming
    upcomingList.forEach((m) => {
      if (m && m.id && m.poster_path && !movieMap.has(m.id)) {
        movieMap.set(m.id, m);
      }
    });

    const combined = Array.from(movieMap.values());

    if (combined.length === 0) {
      console.warn('TMDB returned empty list. Using existing catalog fallback.');
      return null;
    }

    // Format all movies
    const formattedCatalog = combined.map((m, idx) => formatTmdbMovie(m, null, idx));

    // Update cache
    cache.catalog = formattedCatalog;
    cache.catalogTimestamp = now;

    console.log(`🎬 TMDB Live Service: Loaded ${formattedCatalog.length} real-time market movies!`);
    return formattedCatalog;
  } catch (error) {
    console.error('Error fetching live TMDB market catalog:', error.message);
    return null;
  }
};

module.exports = {
  tmdbClient,
  getNowPlayingMovies,
  getPopularMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getLiveMarketCatalog,
  formatTmdbMovie,
};
