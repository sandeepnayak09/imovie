const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getMovies);
router.get('/:id', getMovieById);
router.post('/', protectAdmin, addMovie);
router.put('/:id', protectAdmin, updateMovie);
router.delete('/:id', protectAdmin, deleteMovie);

module.exports = router;
