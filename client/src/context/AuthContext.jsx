import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('imovies_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('imovies_token') || null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync user & watchlist on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('imovies_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session check failed or expired:', err.message);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Fetch watchlist when user changes
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setWatchlist([]);
        return;
      }
      try {
        const res = await api.get(`/favorite?email=${encodeURIComponent(user.email)}`);
        if (res.data?.success && res.data.favoriteIds) {
          setWatchlist(res.data.favoriteIds);
        }
      } catch (err) {
        console.error('Failed to load watchlist:', err.message);
      }
    };

    fetchWatchlist();
  }, [user]);

  // Set session helper
  const setSession = (newToken, userData) => {
    localStorage.setItem('imovies_token', newToken);
    localStorage.setItem('imovies_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  // User Login
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  // User Register - Triggers Brevo OTP & Verification Token
  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  };

  // Verify Registration 6-Digit OTP
  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    if (res.data.success && res.data.token && res.data.user) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    return res.data;
  };

  // Verify Registration via Email Link
  const verifyEmailLink = async (tokenParam, emailParam) => {
    const res = await api.post('/auth/verify-email', { token: tokenParam, email: emailParam });
    if (res.data.success && res.data.token && res.data.user) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    return res.data;
  };

  // Resend Registration OTP
  const resendOtp = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  // Forgot Password - Triggers Brevo Recovery Code & Link
  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  // Reset Password via OTP / Token
  const resetPassword = async ({ email, otp, token: resetToken, newPassword }) => {
    const res = await api.post('/auth/reset-password', {
      email,
      otp,
      token: resetToken,
      newPassword,
    });
    return res.data;
  };

  // Admin Login
  const loginAdmin = async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    if (res.data.success) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Admin login failed');
  };

  // Admin Register
  const registerAdmin = async (username, email, password) => {
    const res = await api.post('/auth/admin/register', { username, email, password });
    if (res.data.success) {
      setSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Admin register failed');
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('imovies_token');
    localStorage.removeItem('imovies_user');
    setToken(null);
    setUser(null);
    setWatchlist([]);
  };

  // Toggle Watchlist
  const toggleWatchlist = async (movieId) => {
    if (!user) {
      throw new Error('Please sign in to add movies to your Watchlist.');
    }
    try {
      const res = await api.post('/favorite/toggle', {
        movieId,
        userEmail: user.email,
      });
      if (res.data.success) {
        if (res.data.action === 'added') {
          setWatchlist((prev) => [...prev, movieId]);
        } else {
          setWatchlist((prev) => prev.filter((id) => id !== movieId));
        }
        return res.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const isInWatchlist = (movieId) => watchlist.includes(movieId);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    verifyOtp,
    verifyEmailLink,
    resendOtp,
    forgotPassword,
    resetPassword,
    loginAdmin,
    registerAdmin,
    logout,
    watchlist,
    toggleWatchlist,
    isInWatchlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
