const express = require('express');
const router = express.Router();
const { getReviewsByMovie, addReview, deleteReview } = require('../controllers/reviewController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/:movieId', getReviewsByMovie);
router.post('/', optionalAuth, addReview);
router.delete('/:id', optionalAuth, deleteReview);

module.exports = router;
