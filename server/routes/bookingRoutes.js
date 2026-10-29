const express = require('express');
const router = express.Router();
const {
  lockSeats,
  unlockSeats,
  confirmBooking,
  getUserBookings,
  getBookingById,
  getAllBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { protectUser, protectAdmin, optionalAuth } = require('../middleware/authMiddleware');

router.post('/lock-seats', optionalAuth, lockSeats);
router.post('/unlock-seats', optionalAuth, unlockSeats);
router.post('/confirm', optionalAuth, confirmBooking);
router.get('/my-bookings', optionalAuth, getUserBookings);
router.get('/admin/all', protectAdmin, getAllBookings);
router.get('/:bookingId', optionalAuth, getBookingById);
router.put('/cancel/:bookingId', optionalAuth, cancelBooking);

module.exports = router;
