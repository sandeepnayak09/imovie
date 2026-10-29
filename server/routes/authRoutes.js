const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyRegistrationOtp,
  verifyEmailLink,
  resendRegistrationOtp,
  forgotPassword,
  resetPassword,
  loginUser,
  loginAdmin,
  registerAdmin,
  getMe,
} = require('../controllers/authController');
const { optionalAuth } = require('../middleware/authMiddleware');

// User Registration & Verification
router.post('/register', registerUser);
router.post('/verify-otp', verifyRegistrationOtp);
router.get('/verify-email', verifyEmailLink);
router.post('/verify-email', verifyEmailLink);
router.post('/resend-otp', resendRegistrationOtp);

// Password Recovery
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authentication & Profile
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.post('/admin/register', registerAdmin);
router.get('/me', optionalAuth, getMe);

module.exports = router;
