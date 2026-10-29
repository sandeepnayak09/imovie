const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  cancelOrFailPayment,
} = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/create-order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.post('/cancel-or-fail', optionalAuth, cancelOrFailPayment);

module.exports = router;
