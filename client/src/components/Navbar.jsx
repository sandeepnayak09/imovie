import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Film,
  Bookmark,
  Ticket,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import api from '../api/axiosConfig';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Detect scroll to darken navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click for search & profile dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/movie?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data?.success) {
          setSearchResults(res.data.movies.slice(0, 5));
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0f171e]/95 backdrop-blur-md border-b border-[#2a3b4c]/60 shadow-xl'
          : 'bg-gradient-to-b from-[#0f171e] via-[#0f171e]/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to={isAuthenticated ? '/home' : '/landing'} className="flex items-center space-x-2 group">
              <div className="flex items-baseline font-black tracking-tight text-2xl sm:text-3xl text-white">
                <span className="text-[#00a8e1] font-extrabold group-hover:scale-110 transition-transform inline-block">i</span>
                <span className="tracking-tighter">Movies</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1] ml-0.5 inline-block animate-pulse"></span>
              </div>
              <span className="hidden md:inline-block text-[10px] tracking-wider uppercase font-bold text-[#00a8e1] bg-[#00a8e1]/10 px-2 py-0.5 rounded border border-[#00a8e1]/30">
                Prime
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/home"
                className={`transition-colors duration-200 ${
                  isActive('/home') ? 'text-[#00a8e1] font-semibold' : 'text-[#8197a4] hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/home?category=movies"
                className={`transition-colors duration-200 ${
                  location.search.includes('movies') ? 'text-[#00a8e1] font-semibold' : 'text-[#8197a4] hover:text-white'
                }`}
              >
                Movies
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/bookings"
                    className={`flex items-center space-x-1.5 transition-colors duration-200 ${
                      isActive('/bookings') ? 'text-[#00a8e1] font-semibold' : 'text-[#8197a4] hover:text-white'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/watchlist"
                    className={`flex items-center space-x-1.5 transition-colors duration-200 ${
                      isActive('/watchlist') ? 'text-[#00a8e1] font-semibold' : 'text-[#8197a4] hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Watchlist</span>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded bg-[#00a8e1]/10 border border-[#00a8e1]/30 text-[#00a8e1] hover:bg-[#00a8e1]/20 transition-all font-semibold text-xs uppercase tracking-wider`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Controls: Search, Auth, Profile */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Bar */}
            <div className="relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search movies, cast, genres..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className={`bg-[#1a242f] text-white text-xs sm:text-sm pl-9 pr-4 py-2 rounded-full border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] transition-all duration-300 ${
                    isSearchOpen ? 'w-52 sm:w-72 shadow-lg shadow-[#00a8e1]/10' : 'w-36 sm:w-56'
                  }`}
                />
                <Search className="w-4 h-4 text-[#8197a4] absolute left-3 pointer-events-none" />
              </form>

              {/* Instant Search Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-[#1a242f] border border-[#2a3b4c] rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-[#2a3b4c]/60">
                  <div className="p-2 text-[11px] font-bold tracking-wider uppercase text-[#8197a4] bg-[#0f171e]/60 px-3">
                    Matching Movies
                  </div>
                  {searchResults.map((movie) => (
                    <Link
                      key={movie._id}
                      to={`/moviedetails/${movie._id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center p-3 hover:bg-[#253342] transition-colors space-x-3"
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.movieName}
                        className="w-10 h-14 object-cover rounded shadow"
                      />
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-sm font-semibold text-white truncate">{movie.movieName}</h4>
                        <p className="text-xs text-[#8197a4] truncate">
                          {movie.genres?.join(', ')} • {movie.language}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-amber-400 font-bold">★ {movie.imdbRating}</span>
                          <span className="text-[10px] text-[#00a8e1] font-semibold">{movie.certification}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="p-2 text-center bg-[#0f171e]/80">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-[#00a8e1] hover:underline"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Sign In CTA */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-[#1a242f] transition-colors border border-transparent hover:border-[#2a3b4c]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00a8e1] to-[#0077b6] flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8197a4] hidden sm:inline" />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a242f] border border-[#2a3b4c] rounded-xl shadow-2xl py-2 z-50 divide-y divide-[#2a3b4c]">
                    <div className="px-4 py-2.5">
                      <p className="text-xs text-[#8197a4] uppercase font-bold tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{user?.username}</p>
                      <p className="text-xs text-[#8197a4] truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1.5 text-[10px] bg-[#00a8e1]/20 text-[#00a8e1] font-bold px-2 py-0.5 rounded border border-[#00a8e1]/40 uppercase tracking-wider">
                          Platform Admin
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/bookings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-[#8197a4] hover:text-white hover:bg-[#253342] transition-colors"
                      >
                        <Ticket className="w-4 h-4 mr-2.5 text-[#00a8e1]" />
                        My Bookings
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-[#8197a4] hover:text-white hover:bg-[#253342] transition-colors"
                      >
                        <Bookmark className="w-4 h-4 mr-2.5 text-[#00a8e1]" />
                        My Watchlist
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-[#00a8e1] font-semibold hover:bg-[#253342] transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 mr-2.5" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#253342] transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-4 py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-cyanGlow"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-[#8197a4] hover:text-white p-1 rounded-md"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1a242f] border-b border-[#2a3b4c] px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/home"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-white hover:text-[#00a8e1]"
          >
            Home
          </Link>
          <Link
            to="/home?category=movies"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[#8197a4] hover:text-white"
          >
            Movies
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-[#8197a4] hover:text-white"
              >
                My Bookings
              </Link>
              <Link
                to="/watchlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-[#8197a4] hover:text-white"
              >
                My Watchlist
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#00a8e1] hover:underline"
            >
              Admin Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left py-2 text-base font-medium text-red-400"
            >
              Sign Out ({user?.username})
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center bg-[#00a8e1] py-2.5 rounded-md font-semibold text-white"
            >
              Sign In to iMovies
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
