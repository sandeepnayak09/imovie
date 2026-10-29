const { getIsConnected } = require('../config/db');
const { store } = require('../data/store');
const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');
const { getMovieDetails } = require('../services/tmdbService');

// @desc    Get all favorites/watchlist for user
// @route   GET /api/favorite
const getFavorites = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required to view watchlist.' });
    }

    let movieIds = [];

    if (getIsConnected()) {
      const favs = await Favorite.find({ userEmail });
      movieIds = favs.map((f) => String(f.movieId));
    } else {
      const favs = store.favorites.filter((f) => f.userEmail.toLowerCase() === userEmail.toLowerCase());
      movieIds = favs.map((f) => String(f.movieId));
    }

    // Resolve movie details for all IDs
    const movies = [];
    for (const mId of movieIds) {
      let movie = null;
      // 1. Try TMDB service
      try {
        movie = await getMovieDetails(mId);
      } catch {}

      // 2. Try DB / store
      if (!movie) {
        if (getIsConnected()) {
          try {
            movie = await Movie.findById(mId);
          } catch {}
        } else {
          movie = store.movies.find((m) => String(m._id) === mId || String(m.id) === mId);
        }
      }

      if (movie) {
        movies.push(movie);
      }
    }

    return res.json({ success: true, count: movies.length, movies, favoriteIds: movieIds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Toggle movie in watchlist
// @route   POST /api/favorite/toggle
const toggleFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'Movie ID is required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Please sign in to save movies to your watchlist.' });
    }

    const cleanMovieId = String(movieId);

    if (getIsConnected()) {
      const existing = await Favorite.findOne({ userEmail, movieId: cleanMovieId });
      if (existing) {
        await Favorite.findByIdAndDelete(existing._id);
        return res.json({ success: true, action: 'removed', message: 'Movie removed from Watchlist.' });
      } else {
        await Favorite.create({ userEmail, movieId: cleanMovieId });
        return res.json({ success: true, action: 'added', message: 'Movie added to Watchlist.' });
      }
    } else {
      const index = store.favorites.findIndex(
        (f) => f.userEmail.toLowerCase() === userEmail.toLowerCase() && String(f.movieId) === cleanMovieId
      );

      if (index !== -1) {
        store.favorites.splice(index, 1);
        return res.json({ success: true, action: 'removed', message: 'Movie removed from Watchlist.' });
      } else {
        store.favorites.push({
          _id: `fav_${Date.now()}`,
          userEmail,
          movieId: cleanMovieId,
          createdAt: new Date(),
        });
        return res.json({ success: true, action: 'added', message: 'Movie added to Watchlist.' });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
};
