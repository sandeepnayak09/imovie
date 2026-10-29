const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getIsConnected } = require('../config/db');
const { store } = require('../data/store');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const generateSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// @desc    Register a new user (generates verification OTP and sends email)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 20 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();

    const otp = generateSixDigitOtp();
    const verificationToken = generateSecureToken();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (getIsConnected()) {
      const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
      });

      if (existingUser) {
        if (existingUser.isVerified) {
          return res.status(400).json({
            success: false,
            message:
              existingUser.email === normalizedEmail
                ? 'Email is already registered and verified. Please sign in.'
                : 'Username is already taken.',
          });
        }

        // User exists but has not completed email verification yet:
        // Update credentials, generate fresh OTP, and resend verification email
        existingUser.username = trimmedUsername;
        existingUser.password = hashedPassword;
        existingUser.verificationOtp = otp;
        existingUser.verificationToken = verificationToken;
        existingUser.otpExpiresAt = otpExpiresAt;
        await existingUser.save();
      } else {
        await User.create({
          username: trimmedUsername,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user',
          isVerified: false,
          verificationOtp: otp,
          verificationToken: verificationToken,
          otpExpiresAt,
        });
      }
    } else {
      // In-Memory store
      const existingUserIndex = store.users.findIndex(
        (u) => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (existingUserIndex !== -1) {
        const existing = store.users[existingUserIndex];
        if (existing.isVerified) {
          return res.status(400).json({
            success: false,
            message:
              existing.email.toLowerCase() === normalizedEmail
                ? 'Email is already registered and verified. Please sign in.'
                : 'Username is already taken.',
          });
        }

        // Update unverified user
        store.users[existingUserIndex] = {
          ...existing,
          username: trimmedUsername,
          password: hashedPassword,
          verificationOtp: otp,
          verificationToken,
          otpExpiresAt,
        };
      } else {
        store.users.push({
          _id: `user_${Date.now()}`,
          username: trimmedUsername,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user',
          isVerified: false,
          verificationOtp: otp,
          verificationToken,
          otpExpiresAt,
          createdAt: new Date(),
        });
      }
    }

    // Dispatch Verification Email with real delivery verification
    const emailResult = await sendVerificationEmail(normalizedEmail, {
      verificationToken,
      otp,
      username: trimmedUsername,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to dispatch verification email:', emailResult.error);
      return res.status(502).json({
        success: false,
        message: `Failed to deliver verification email to ${normalizedEmail}: ${emailResult.error || 'Email service error'}. Please verify email address or service configuration.`,
      });
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please enter it to verify your account.`,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

// @desc    Verify Registration 6-Digit OTP
// @route   POST /api/auth/verify-otp
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and the 6-digit OTP.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registration found for this email address.' });
    }

    if (user.isVerified) {
      const token = generateToken({ id: user._id, email: user.email, username: user.username, role: user.role || 'user' });
      return res.status(200).json({
        success: true,
        message: 'Account is already verified. Signed in successfully!',
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role || 'user' },
      });
    }

    if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
        isExpired: true,
      });
    }

    // Mark user as verified
    if (getIsConnected()) {
      user.isVerified = true;
      user.verificationOtp = undefined;
      user.verificationToken = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
    } else {
      user.isVerified = true;
      user.verificationOtp = null;
      user.verificationToken = null;
      user.otpExpiresAt = null;
    }

    const token = generateToken({ id: user._id, email: user.email, username: user.username, role: user.role || 'user' });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to iMovies Prime.',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role || 'user' },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error verifying OTP.' });
  }
};

// @desc    Verify Registration via Direct Email Link
// @route   GET /api/auth/verify-email
// @route   POST /api/auth/verify-email
const verifyEmailLink = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    const email = req.query.email || req.body.email;

    if (!token || !email) {
      return res.status(400).json({ success: false, message: 'Verification token and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail, verificationToken: token });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail && u.verificationToken === token);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already consumed email verification link.',
      });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'This verification link has expired. Please request a fresh code on the sign-in page.',
      });
    }

    if (getIsConnected()) {
      user.isVerified = true;
      user.verificationOtp = undefined;
      user.verificationToken = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
    } else {
      user.isVerified = true;
      user.verificationOtp = null;
      user.verificationToken = null;
      user.otpExpiresAt = null;
    }

    const authToken = generateToken({ id: user._id, email: user.email, username: user.username, role: user.role || 'user' });

    return res.status(200).json({
      success: true,
      message: 'Your email address has been successfully verified! Welcome to iMovies Prime.',
      token: authToken,
      user: { id: user._id, username: user.username, email: user.email, role: user.role || 'user' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during link verification.' });
  }
};

// @desc    Resend Registration Verification OTP
// @route   POST /api/auth/resend-otp
const resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please sign in directly.' });
    }

    const otp = generateSixDigitOtp();
    const verificationToken = generateSecureToken();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (getIsConnected()) {
      user.verificationOtp = otp;
      user.verificationToken = verificationToken;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user.verificationOtp = otp;
      user.verificationToken = verificationToken;
      user.otpExpiresAt = otpExpiresAt;
    }

    const emailResult = await sendVerificationEmail(normalizedEmail, {
      verificationToken,
      otp,
      username: user.username,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to resend verification email:', emailResult.error);
      return res.status(502).json({
        success: false,
        message: `Failed to resend verification code: ${emailResult.error || 'Email service error'}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `A fresh 6-digit code has been dispatched to ${normalizedEmail}.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to resend verification code.' });
  }
};

// @desc    Authenticate user & get token (Enforces email verification check)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // MANDATORY GATE: Check email verification status
    if (user.isVerified === false) {
      // Refresh OTP and dispatch email so user can complete verification immediately
      const otp = generateSixDigitOtp();
      const verificationToken = generateSecureToken();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      if (getIsConnected()) {
        user.verificationOtp = otp;
        user.verificationToken = verificationToken;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();
      } else {
        user.verificationOtp = otp;
        user.verificationToken = verificationToken;
        user.otpExpiresAt = otpExpiresAt;
      }

      const emailResult = await sendVerificationEmail(normalizedEmail, {
        verificationToken,
        otp,
        username: user.username,
      });

      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: emailResult.success
          ? 'Your email address is not verified. A new 6-digit verification code has been sent to your inbox.'
          : `Your account is not verified. Email dispatch notice: ${emailResult.error}`,
      });
    }

    const token = generateToken({ id: user._id, email: user.email, username: user.username, role: 'user' });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: 'user' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

// @desc    Request Password Reset Link & OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    const otp = generateSixDigitOtp();
    const resetToken = generateSecureToken();
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (getIsConnected()) {
      user.resetPasswordOtp = otp;
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = resetExpiresAt;
      await user.save();
    } else {
      user.resetPasswordOtp = otp;
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = resetExpiresAt;
    }

    const emailResult = await sendPasswordResetEmail(normalizedEmail, {
      resetToken,
      otp,
      username: user.username,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to dispatch password reset email:', emailResult.error);
      return res.status(502).json({
        success: false,
        message: `Failed to deliver recovery code to ${normalizedEmail}: ${emailResult.error || 'Email service error'}.`,
      });
    }

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      message: `Password reset instructions and 6-digit recovery code have been sent to ${normalizedEmail}.`,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error processing password reset.' });
  }
};

// @desc    Reset Password with 6-Digit OTP or Token
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, token, newPassword } = req.body;

    if (!email || (!otp && !token) || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, recovery code/token, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Validate expiration
    if (user.resetPasswordExpiresAt && new Date() > new Date(user.resetPasswordExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new one.',
      });
    }

    // Validate matching OTP or Token
    const isOtpValid = otp && user.resetPasswordOtp === String(otp).trim();
    const isTokenValid = token && user.resetPasswordToken === String(token).trim();

    if (!isOtpValid && !isTokenValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password recovery code or link. Please verify and try again.',
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (getIsConnected()) {
      user.password = hashedPassword;
      user.resetPasswordOtp = undefined;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      user.isVerified = true; // Recovering password also validates email ownership
      await user.save();
    } else {
      user.password = hashedPassword;
      user.resetPasswordOtp = null;
      user.resetPasswordToken = null;
      user.resetPasswordExpiresAt = null;
      user.isVerified = true;
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error resetting password.' });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (getIsConnected()) {
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid admin password.' });
      }

      const token = generateToken({ id: admin._id, email: admin.email, username: admin.username, role: 'admin' });

      return res.status(200).json({
        success: true,
        message: 'Admin access granted.',
        token,
        user: { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
      });
    } else {
      // In-Memory store
      const admin = store.admins.find((a) => a.email.toLowerCase() === normalizedEmail);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid admin password.' });
      }

      const token = generateToken({ id: admin._id, email: admin.email, username: admin.username, role: 'admin' });

      return res.status(200).json({
        success: true,
        message: 'Admin access granted.',
        token,
        user: { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during admin login.' });
  }
};

// @desc    Admin Register (optional helper)
// @route   POST /api/auth/admin/register
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (getIsConnected()) {
      const adminExists = await Admin.findOne({
        $or: [{ email: normalizedEmail }, { username: username.trim() }],
      });
      if (adminExists) {
        return res.status(400).json({ success: false, message: 'Admin account already exists with that email/username.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await Admin.create({
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
      });

      const token = generateToken({ id: admin._id, email: admin.email, username: admin.username, role: 'admin' });

      return res.status(201).json({
        success: true,
        message: 'Admin registered successfully!',
        token,
        user: { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
      });
    } else {
      const exists = store.admins.find(
        (a) => a.email.toLowerCase() === normalizedEmail || a.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        return res.status(400).json({ success: false, message: 'Admin already exists with that email or username.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = {
        _id: `admin_${Date.now()}`,
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      };
      store.admins.push(newAdmin);

      const token = generateToken({ id: newAdmin._id, email: newAdmin.email, username: newAdmin.username, role: 'admin' });

      return res.status(201).json({
        success: true,
        message: 'Admin registered successfully!',
        token,
        user: { id: newAdmin._id, username: newAdmin.username, email: newAdmin.email, role: 'admin' },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const authData = req.user || req.admin;
    if (!authData) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (getIsConnected()) {
      if (authData.role === 'admin') {
        const admin = await Admin.findById(authData.id).select('-password');
        return res.json({ success: true, user: admin });
      } else {
        const user = await User.findById(authData.id).select('-password');
        return res.json({ success: true, user });
      }
    } else {
      if (authData.role === 'admin') {
        const admin = store.admins.find((a) => a._id === authData.id || a.email === authData.email);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
        const { password, ...adminInfo } = admin;
        return res.json({ success: true, user: adminInfo });
      } else {
        const user = store.users.find((u) => u._id === authData.id || u.email === authData.email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        const { password, ...userInfo } = user;
        return res.json({ success: true, user: userInfo });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
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
};
