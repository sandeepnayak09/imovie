const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite } = require('../controllers/favoriteController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getFavorites);
router.post('/toggle', optionalAuth, toggleFavorite);

module.exports = router;
