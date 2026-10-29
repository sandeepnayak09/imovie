import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Lock, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await resetPassword({
        email,
        token,
        newPassword,
      });

      if (res.success) {
        setIsDone(true);
        toast.success(res.message || 'Password reset successfully!');
      } else {
        toast.error(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Prime Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00a8e1]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl p-8 relative z-10">
        {!isDone ? (
          <>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00a8e1]/15 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Create New Password</h2>
                <p className="text-xs text-[#8197a4]">
                  Account: <span className="text-white font-medium">{email || 'iMovies User'}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full bg-[#0f171e] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-colors"
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
                {isSubmitting ? 'Updating Password...' : 'Save & Set New Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#00c853]/15 border border-[#00c853]/40 flex items-center justify-center mx-auto mb-4 text-[#00c853]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Password Updated!</h2>
            <p className="text-xs text-gray-300 mb-6">
              Your password has been changed successfully. You can now sign in with your updated credentials.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-all"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
