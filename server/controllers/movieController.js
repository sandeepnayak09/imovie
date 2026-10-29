const { getIsConnected } = require('../config/db');
const { store } = require('../data/store');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const {
  getLiveMarketCatalog,
  getMovieDetails,
  searchMovies,
} = require('../services/tmdbService');

// @desc    Get all movies with live TMDB market integration, search, & filters
// @route   GET /api/movie
const getMovies = async (req, res) => {
  try {
    const { genre, language, search, featured } = req.query;

    let moviesList = [];

    // 1. If searching, prioritize live TMDB search
    if (search && search.trim()) {
      const tmdbSearchResults = await searchMovies(search.trim());

      // Also search local custom movies
      let localMatches = [];
      if (getIsConnected()) {
        localMatches = await Movie.find({
          $or: [
            { movieName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { director: { $regex: search, $options: 'i' } },
          ],
        });
      } else {
        const q = search.toLowerCase();
        localMatches = store.movies.filter(
          (m) =>
            m.movieName.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            (m.director && m.director.toLowerCase().includes(q))
        );
      }

      // Merge results avoiding duplicate IDs
      const map = new Map();
      tmdbSearchResults.forEach((m) => map.set(String(m._id), m));
      localMatches.forEach((m) => map.set(String(m._id), m));

      moviesList = Array.from(map.values());
    } else {
      // 2. Standard browsing: Fetch live TMDB market movies (Now Playing & Popular)
      const liveCatalog = await getLiveMarketCatalog();

      // Also fetch any custom movies added by admin
      let customMovies = [];
      if (getIsConnected()) {
        customMovies = await Movie.find().sort({ createdAt: -1 });
      } else {
        customMovies = store.movies || [];
      }

      if (liveCatalog && liveCatalog.length > 0) {
        // Merge live TMDB movies with custom movies
        const map = new Map();
        customMovies.forEach((m) => map.set(String(m._id), m));
        liveCatalog.forEach((m) => {
          if (!map.has(String(m._id))) {
            map.set(String(m._id), m);
          }
        });
        moviesList = Array.from(map.values());
      } else {
        // Fallback to local store/DB if offline or rate limited
        moviesList = customMovies;
      }
    }

    // 3. Apply Filters
    let result = [...moviesList];

    // Genre filter
    if (genre && genre !== 'All') {
      const targetGenre = genre.toLowerCase();
      result = result.filter(
        (m) =>
          m.genres &&
          m.genres.some(
            (g) =>
              g.toLowerCase() === targetGenre ||
              (targetGenre === 'sci-fi' && (g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('science fiction')))
          )
      );
    }

    // Language filter
    if (language && language !== 'All') {
      const targetLang = language.toLowerCase();
      result = result.filter(
        (m) =>
          m.language &&
          (m.language.toLowerCase() === targetLang ||
            (targetLang === 'english' && m.language.toLowerCase().startsWith('en')) ||
            (targetLang === 'hindi' && m.language.toLowerCase().startsWith('hi')))
      );
    }

    // Featured filter
    if (featured === 'true') {
      result = result.filter((m) => m.featured === true || (m.imdbRating && m.imdbRating >= 8.4));
    }

    return res.json({
      success: true,
      source: 'TMDB Live Market API',
      count: result.length,
      movies: result,
    });
  } catch (error) {
    console.error('Error in getMovies controller:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching movies.',
    });
  }
};

// @desc    Get single movie by ID (checks TMDB live details or local DB)
// @route   GET /api/movie/:id
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a numeric TMDB ID (or starts with tmdb_)
    const isTmdbId = /^\d+$/.test(id) || id.startsWith('tmdb_');
    const cleanId = id.replace('tmdb_', '');

    let movie = null;

    if (isTmdbId) {
      // Fetch rich details from TMDB with videos & cast
      movie = await getMovieDetails(cleanId);
    }

    // If not found in TMDB or not a TMDB ID, check MongoDB / local store
    if (!movie) {
      if (getIsConnected()) {
        try {
          movie = await Movie.findById(id);
        } catch {
          // not a valid Mongo ObjectId
        }
      } else {
        movie = store.movies.find((m) => String(m._id) === String(id) || String(m.id) === String(id));
      }
    }

    // If still not found, try TMDB as a fallback
    if (!movie) {
      movie = await getMovieDetails(cleanId);
    }

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    return res.json({ success: true, source: isTmdbId ? 'TMDB Live API' : 'Database', movie });
  } catch (error) {
    console.error('Error in getMovieById controller:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Add a new movie (Admin)
// @route   POST /api/movie
const addMovie = async (req, res) => {
  try {
    const {
      movieName,
      description,
      genres,
      releaseDate,
      language,
      duration,
      certification,
      posterUrl,
      backdropUrl,
      trailerUrl,
      director,
      cast,
      imdbRating,
      featured,
    } = req.body;

    if (!movieName || !description || !genres || !releaseDate || !language || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: movieName, description, genres, releaseDate, language, duration.',
      });
    }

    const parsedGenres = Array.isArray(genres)
      ? genres
      : String(genres).split(',').map((g) => g.trim());

    const parsedCast = Array.isArray(cast)
      ? cast
      : cast
      ? String(cast).split(',').map((c) => c.trim())
      : ['Lead Star'];

    const movieData = {
      movieName: movieName.trim(),
      description: description.trim(),
      genres: parsedGenres,
      releaseDate: new Date(releaseDate),
      language: language.trim(),
      duration: duration,
      certification: certification || 'U/A 16+',
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      director: director || 'Visionary Director',
      cast: parsedCast,
      imdbRating: Number(imdbRating) || 8.0,
      featured: Boolean(featured),
    };

    if (getIsConnected()) {
      const newMovie = await Movie.create(movieData);
      return res.status(201).json({ success: true, message: 'Movie added successfully!', movie: newMovie });
    } else {
      const newMovie = {
        _id: `custom_${Date.now()}`,
        ...movieData,
        createdAt: new Date(),
      };
      store.movies.unshift(newMovie);
      return res.status(201).json({ success: true, message: 'Movie added successfully!', movie: newMovie });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error adding movie.' });
  }
};

// @desc    Update movie details
// @route   PUT /api/movie/:id
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!updatedMovie) {
        return res.status(404).json({ success: false, message: 'Movie not found.' });
      }
      return res.json({ success: true, message: 'Movie updated successfully!', movie: updatedMovie });
    } else {
      const index = store.movies.findIndex((m) => String(m._id) === String(id) || String(m.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Movie not found.' });
      }

      store.movies[index] = {
        ...store.movies[index],
        ...req.body,
        updatedAt: new Date(),
      };

      return res.json({ success: true, message: 'Movie updated successfully!', movie: store.movies[index] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating movie.' });
  }
};

// @desc    Delete movie
// @route   DELETE /api/movie/:id
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const movie = await Movie.findByIdAndDelete(id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found.' });
      }
      await Show.deleteMany({ movieId: id });
      return res.json({ success: true, message: 'Movie and associated show schedules deleted successfully.' });
    } else {
      const index = store.movies.findIndex((m) => String(m._id) === String(id) || String(m.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Movie not found.' });
      }
      store.movies.splice(index, 1);
      store.shows = store.shows.filter((s) => String(s.movieId) !== String(id));
      return res.json({ success: true, message: 'Movie and associated show schedules deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting movie.' });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
};
