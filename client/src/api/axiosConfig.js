import axios from 'axios';

// Resolve API Base URL cleanly regardless of whether VITE_API_URL has a trailing slash or missing /api
const getResolvedBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getResolvedBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: normalize endpoint URLs & attach JWT token
api.interceptors.request.use(
  (config) => {
    // Prevent duplicate /api/api/ if caller already includes /api prefix
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    const token = localStorage.getItem('imovies_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (
        !currentPath.includes('/login') &&
        !currentPath.includes('/register') &&
        !currentPath.includes('/landing')
      ) {
        // Only clear if on protected route
      }
    }
    return Promise.reject(error);
  }
);

export default api;
