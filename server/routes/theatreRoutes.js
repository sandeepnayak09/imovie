const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getTheatres);
router.get('/:id', getTheatreById);
router.post('/', protectAdmin, addTheatre);
router.put('/:id', protectAdmin, updateTheatre);
router.delete('/:id', protectAdmin, deleteTheatre);

module.exports = router;
