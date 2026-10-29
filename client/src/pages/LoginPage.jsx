import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  UserCheck,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  X,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const LoginPage = () => {
  const {
    login,
    loginAdmin,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdminTab, setIsAdminTab] = useState(
    location.state?.role === 'admin' || location.search.includes('admin')
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Unverified User OTP Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const from = location.state?.from?.pathname || (isAdminTab ? '/admin' : '/home');

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isAdminTab) {
        await loginAdmin(email, password);
        toast.success('Admin authentication granted! Welcome back.');
        navigate('/admin');
      } else {
        await login(email, password);
        toast.success('Welcome back to iMovies Prime!');
        navigate(from === '/login' ? '/home' : from);
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.isUnverified) {
        setUnverifiedEmail(errData.email || email);
        setShowVerifyModal(true);
        setResendCooldown(45);
        toast.warning(errData.message || 'Please verify your email address to proceed.');
      } else {
        toast.error(errData?.message || err.message || 'Login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoUser = () => {
    setIsAdminTab(false);
    setEmail('user@imovies.com');
    setPassword('password123');
  };

  const handleFillDemoAdmin = () => {
    setIsAdminTab(true);
    setEmail('admin@imovies.com');
    setPassword('admin123');
  };

  // Forgot Password: Step 1 - Send Recovery OTP
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await forgotPassword(forgotEmail);
      toast.success(res.message || 'Password recovery OTP sent to your email.');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send recovery code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Submit OTP and New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit recovery code from your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please recheck.');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await resetPassword({
        email: forgotEmail,
        otp: forgotOtp.trim(),
        newPassword,
      });

      toast.success(res.message || 'Password reset successful! You can now log in.');
      setShowForgotModal(false);
      setEmail(forgotEmail);
      setPassword('');
      setForgotStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Password reset failed.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Unverified User OTP Submission
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!verifyOtpInput || verifyOtpInput.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await verifyOtp(unverifiedEmail, verifyOtpInput.trim());
      if (res.success) {
        toast.success('Account verified successfully! Welcome to iMovies Prime.');
        setShowVerifyModal(false);
        navigate('/home');
      } else {
        toast.error(res.message || 'Verification failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to verify OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendUnverifiedOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await resendOtp(unverifiedEmail);
      if (res && res.success) {
        toast.success(res.message || 'Fresh verification code sent to your inbox.');
        setResendCooldown(60);
      } else {
        toast.error(res?.message || 'Failed to resend code.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00a8e1]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link to="/landing" className="inline-flex items-baseline font-black tracking-tight text-3xl sm:text-4xl text-white">
          <span className="text-[#00a8e1] font-extrabold">i</span>
          <span className="tracking-tighter">Movies</span>
          <span className="w-2 h-2 rounded-full bg-[#00a8e1] ml-0.5"></span>
        </Link>
        <p className="text-xs text-[#8197a4] mt-1 uppercase font-bold tracking-widest">
          Prime Ticket Booking Experience
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Tab Switcher: User vs Admin */}
        <div className="flex bg-[#0f171e] p-1 rounded-xl mb-6 border border-[#2a3b4c]">
          <button
            type="button"
            onClick={() => setIsAdminTab(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isAdminTab
                ? 'bg-[#00a8e1] text-white shadow-md'
                : 'text-[#8197a4] hover:text-white'
            }`}
          >
            Customer Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsAdminTab(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isAdminTab
                ? 'bg-[#00a8e1] text-white shadow-md'
                : 'text-[#8197a4] hover:text-white'
            }`}
          >
            Admin Portal
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          {isAdminTab ? 'Administrator Login' : 'Sign in to iMovies'}
        </h2>
        <p className="text-xs text-[#8197a4] mb-6">
          {isAdminTab
            ? 'Manage movies, schedules, theatres, and live platform reservations'
            : 'Access your tickets, watchlist, and personalized recommendations'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-colors"
              />
              <Mail className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
                Password
              </label>
              {!isAdminTab && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                    setForgotStep(1);
                  }}
                  className="text-xs text-[#00a8e1] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-colors"
              />
              <Lock className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all duration-200 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Authenticating...' : isAdminTab ? 'Enter Admin Console' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast-Fill Buttons */}
        <div className="mt-6 pt-5 border-t border-[#2a3b4c] space-y-2">
          <p className="text-[11px] text-[#8197a4] uppercase font-bold text-center tracking-wider">
            Quick Demo Sign-In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillDemoUser}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg bg-[#0f171e] hover:bg-[#253342] border border-[#2a3b4c] text-xs font-semibold text-gray-300 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00a8e1]" />
              <span>Fill Demo User</span>
            </button>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg bg-[#0f171e] hover:bg-[#253342] border border-[#2a3b4c] text-xs font-semibold text-gray-300 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-xs text-[#8197a4]">
          New to iMovies?{' '}
          <Link to="/register" className="text-[#00a8e1] font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#8197a4] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Reset Password</h3>
                <p className="text-xs text-[#8197a4]">
                  {forgotStep === 1 ? 'Step 1: Request Recovery OTP' : 'Step 2: Set New Password'}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Enter your registered iMovies email address. We'll send you a 6-digit recovery OTP and a direct reset link.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isForgotLoading ? (
                    <span>Sending Recovery Code...</span>
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Enter the 6-digit recovery OTP sent to{' '}
                  <span className="text-[#00a8e1] font-bold">{forgotEmail}</span> along with your new password.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
                    6-Digit Recovery Code (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-[#0f171e] text-center text-xl font-mono tracking-widest text-[#00a8e1] font-bold py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
                    New Password (Min. 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 bg-[#0f171e] hover:bg-[#253342] text-gray-300 py-2.5 rounded-xl font-semibold text-xs border border-[#2a3b4c]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Updating Password...' : 'Save & Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* UNVERIFIED USER EMAIL OTP MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1a242f] border border-[#00a8e1]/40 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 text-[#8197a4] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#00a8e1]/15 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Email Verification Required</h3>
                <p className="text-xs text-[#8197a4]">Enter Code to Unlock Sign In</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-5 leading-relaxed">
              Your account for <span className="text-[#00a8e1] font-bold">{unverifiedEmail}</span> is registered but not verified yet. We have dispatched a 6-digit verification code to your inbox.
            </p>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
                  6-Digit Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verifyOtpInput}
                  onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[#0f171e] text-center text-2xl font-mono tracking-widest text-[#00a8e1] font-black py-3 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || verifyOtpInput.length !== 6}
                className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Email & Log In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-[#2a3b4c] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResendUnverifiedOtp}
                disabled={resendCooldown > 0}
                className="text-[#00a8e1] hover:underline font-semibold disabled:text-[#8197a4] disabled:no-underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-[#8197a4] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
