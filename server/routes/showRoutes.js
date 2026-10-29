const express = require('express');
const router = express.Router();
const {
  getShowsByMovie,
  getShowById,
  createShow,
  deleteShow,
  getAllShows,
} = require('../controllers/showController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getAllShows);
router.get('/movie/:movieId', getShowsByMovie);
router.get('/:showId', getShowById);
router.post('/', protectAdmin, createShow);
router.delete('/:showId', protectAdmin, deleteShow);

module.exports = router;
