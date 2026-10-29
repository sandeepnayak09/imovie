const { getIsConnected } = require('../config/db');
const { store } = require('../data/store');
const Review = require('../models/reviewModel');

// @desc    Get all reviews for a movie
// @route   GET /api/review/:movieId
const getReviewsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (getIsConnected()) {
      const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
      const avgRating =
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : null;

      return res.json({ success: true, count: reviews.length, avgRating, reviews });
    } else {
      const reviews = store.reviews
        .filter((r) => r.movieId === movieId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const avgRating =
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : null;

      return res.json({ success: true, count: reviews.length, avgRating, reviews });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Add review for a movie
// @route   POST /api/review
const addReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;
    const username = req.user?.username || req.body.username || userEmail?.split('@')[0] || 'Cinephile';

    if (!movieId || !rating || !reviewText) {
      return res.status(400).json({ success: false, message: 'Please provide movieId, rating, and reviewText.' });
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required to post a review.' });
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    if (getIsConnected()) {
      const newReview = await Review.create({
        userEmail,
        username,
        movieId,
        rating: ratingNum,
        reviewText: reviewText.trim(),
      });
      return res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
    } else {
      const newReview = {
        _id: `rev_${Date.now()}`,
        userEmail,
        username,
        movieId,
        rating: ratingNum,
        reviewText: reviewText.trim(),
        createdAt: new Date(),
      };
      store.reviews.unshift(newReview);
      return res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/review/:id
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email || req.admin?.email;
    const isAdmin = req.admin?.role === 'admin';

    if (getIsConnected()) {
      const review = await Review.findById(id);
      if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

      if (!isAdmin && review.userEmail !== userEmail) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
      }

      await Review.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Review deleted successfully.' });
    } else {
      const idx = store.reviews.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found.' });

      const review = store.reviews[idx];
      if (!isAdmin && review.userEmail !== userEmail) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
      }

      store.reviews.splice(idx, 1);
      return res.json({ success: true, message: 'Review deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
  getReviewsByMovie,
  addReview,
  deleteReview,
};
