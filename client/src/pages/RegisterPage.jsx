import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Lock, Mail, User, ShieldCheck, ArrowRight, RefreshCw, KeyRound, CheckCircle2, ChevronLeft } from 'lucide-react';

const RegisterPage = () => {
  const { register, verifyOtp, resendOtp, registerAdmin } = useAuth();
  const navigate = useNavigate();

  const [isAdminTab, setIsAdminTab] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const otpInputRefs = useRef([]);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when modal opens
  useEffect(() => {
    if (showOtpModal && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showOtpModal]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.error('Please fill out all required fields.');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast.error('Username must be between 3 and 20 characters.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isAdminTab) {
        await registerAdmin(username, email, password);
        toast.success('Admin account created! Welcome to the Admin Console.');
        navigate('/admin');
      } else {
        const response = await register(username, email, password);
        if (response.requiresOtp) {
          toast.info(response.message || 'Verification code sent to your email.');
          setShowOtpModal(true);
          setResendCooldown(45);
        } else {
          toast.success('Account created successfully! Welcome to iMovies Prime.');
          navigate('/home');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    // If pasted full 6 digits
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otpValues];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpValues(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = cleanVal[cleanVal.length - 1];
    setOtpValues(newOtp);

    // Auto-advance
    if (index < 5 && cleanVal) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const digits = pasteData.split('');
    const newOtp = [...otpValues];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtpValues(newOtp);
    const targetIdx = Math.min(digits.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('').trim();

    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await verifyOtp(email, fullOtp);
      if (res.success) {
        toast.success('Email verified successfully! Welcome to iMovies Prime.');
        setShowOtpModal(false);
        navigate('/home');
      } else {
        toast.error(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const res = await resendOtp(email);
      if (res && res.success) {
        toast.success(res.message || 'Fresh verification code dispatched to your email.');
        setResendCooldown(60);
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        toast.error(res?.message || 'Failed to resend code.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
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
          Create Your Prime Ticket Account
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Tab Switcher */}
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
            Customer Account
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
            Admin Account
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          {isAdminTab ? 'Register Platform Admin' : 'Join iMovies Prime'}
        </h2>
        <p className="text-xs text-[#8197a4] mb-6">
          {isAdminTab
            ? 'Set up administrator credentials to control shows and catalog'
            : 'Email verification via secure OTP & direct link is required.'}
        </p>

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cinephile_007"
                className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-colors"
              />
              <User className="w-4 h-4 text-[#8197a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-[#8197a4] uppercase tracking-wider mb-1">
              Password (Min. 6 characters)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
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
            className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span>Sending Verification Code...</span>
            ) : (
              <>
                <span>{isAdminTab ? 'Create Admin Account' : 'Verify & Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-xs text-[#8197a4]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00a8e1] font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>

      {/* INTERACTIVE OTP AUTHENTICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1a242f] border border-[#00a8e1]/40 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00a8e1] via-[#00c853] to-[#00a8e1]"></div>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#00a8e1]/15 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Enter Verification Code</h3>
                <p className="text-xs text-[#8197a4]">One-Time Password (OTP) Authentication</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-5 leading-relaxed">
              We dispatched a secure 6-digit code and direct activation link to{' '}
              <span className="text-[#00a8e1] font-bold">{email}</span>.
            </p>

            {/* 6 Digit Input Boxes */}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 sm:w-12 h-14 text-center text-xl sm:text-2xl font-black text-white bg-[#0f171e] border-2 border-[#2a3b4c] focus:border-[#00a8e1] focus:ring-2 focus:ring-[#00a8e1]/30 rounded-xl outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpValues.join('').length !== 6}
                className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                {isVerifyingOtp ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Enter iMovies</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Code & Info */}
            <div className="mt-5 pt-4 border-t border-[#2a3b4c] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="text-[#00a8e1] hover:underline font-semibold disabled:text-[#8197a4] disabled:no-underline flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-[#8197a4] hover:text-white flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Edit Email</span>
              </button>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-[#0f171e]/70 border border-[#2a3b4c] text-[11px] text-[#8197a4] text-center">
              💡 Tip: You can also tap the direct verification button in the email on your mobile device.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
