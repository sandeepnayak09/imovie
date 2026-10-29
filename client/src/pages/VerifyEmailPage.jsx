import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { verifyEmailLink } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      if (!token || !email) {
        setStatus('error');
        setErrorMessage('Invalid or missing email verification parameters in link.');
        return;
      }

      try {
        const res = await verifyEmailLink(token, email);
        if (res.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(res.message || 'Verification link expired or invalid.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.message || err.message || 'Verification link expired or invalid.'
        );
      }
    };

    handleVerification();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Prime Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00a8e1]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl p-8 text-center relative z-10">
        {status === 'verifying' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 text-[#00a8e1] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Verifying Your Email</h2>
            <p className="text-xs text-[#8197a4]">
              Validating security token for <span className="text-white font-medium">{email}</span>...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#00c853]/15 border border-[#00c853]/40 flex items-center justify-center mx-auto mb-4 text-[#00c853]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Email Verified!</h2>
            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              Your iMovies Prime account has been successfully verified and activated. You're ready to book movie tickets with live seat selection.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center justify-center space-x-2 w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-cyanGlow transition-all"
            >
              <span>Explore Market Movies</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-500">
              <XCircle className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Verification Failed</h2>
            <p className="text-xs text-red-400 mb-6 leading-relaxed">
              {errorMessage || 'The verification link may have expired or already been used.'}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full bg-[#00a8e1] hover:bg-[#1b9ce2] text-white py-3 rounded-xl font-bold text-sm transition-all"
              >
                Sign In to Request New Code
              </Link>
              <Link
                to="/register"
                className="w-full bg-[#0f171e] hover:bg-[#253342] text-gray-300 py-2.5 rounded-xl text-xs font-semibold border border-[#2a3b4c]"
              >
                Create a New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
