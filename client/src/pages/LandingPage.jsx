import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Ticket, ShieldCheck, Clock, Star, Sparkles, ChevronRight, Play } from 'lucide-react';
import api from '../api/axiosConfig';
import MovieCarousel from '../components/MovieCarousel';

const LandingPage = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await api.get('/movie');
        if (res.data?.success) {
          setFeaturedMovies(res.data.movies);
        }
      } catch (err) {
        console.error('Landing page movie fetch error:', err);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white">
      {/* Prime Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Cinematic Backdrop Image with Prime Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80"
            alt="Prime Cinema"
            className="w-full h-full object-cover opacity-35 scale-105 transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/75 to-[#0f171e]/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/60 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#00a8e1]/10 border border-[#00a8e1]/30 px-3 py-1.5 rounded-full text-[#00a8e1] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Premier Cinema Experience</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight">
            Welcome to <span className="text-[#00a8e1]">iMovies</span> Prime
          </h1>

          <p className="text-base sm:text-xl text-[#8197a4] max-w-2xl mx-auto leading-relaxed">
            Reserve premium auditorium recliners, experience Dolby Atmos sound, and book your tickets in real-time with zero hassle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/home"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-cyanGlow transition-all duration-300"
            >
              <Ticket className="w-5 h-5" />
              <span>Browse Movies & Showtimes</span>
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#1a242f] hover:bg-[#253342] text-white border border-[#2a3b4c] px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
            >
              <span>Join Prime Tickets</span>
              <ChevronRight className="w-4 h-4 text-[#00a8e1]" />
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8197a4]">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00a8e1]" />
              <span>Real-Time TTL Seat Locking</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#00a8e1]" />
              <span>Instant Digital QR Passes</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Dolby Atmos 7.1 & 4K Laser</span>
            </span>
          </div>
        </div>
      </div>

      {/* Featured Movies Showcase Row */}
      {featuredMovies.length > 0 && (
        <div className="relative -mt-10 z-20">
          <MovieCarousel
            title="Now In Theatres"
            subtitle="Explore high-octane blockbusters playing at auditoriums near you"
            movies={featuredMovies}
            isHorizontal={true}
          />
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Choose <span className="text-[#00a8e1]">iMovies</span>?
          </h2>
          <p className="text-sm sm:text-base text-[#8197a4] mt-3">
            Engineered with the cutting-edge Amazon Prime Video aesthetic and enterprise-grade reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1a242f] border border-[#2a3b4c] p-8 rounded-2xl hover:border-[#00a8e1]/60 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 bg-[#00a8e1]/10 rounded-xl flex items-center justify-center text-[#00a8e1] border border-[#00a8e1]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Live Seat Locking with TTL</h3>
            <p className="text-sm text-[#8197a4] leading-relaxed">
              When you select your seats, our system instantly locks them across all sessions with a 5-minute countdown timer so nobody can snipe your seats.
            </p>
          </div>

          <div className="bg-[#1a242f] border border-[#2a3b4c] p-8 rounded-2xl hover:border-[#00a8e1]/60 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 bg-[#00a8e1]/10 rounded-xl flex items-center justify-center text-[#00a8e1] border border-[#00a8e1]/30">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Tier-Based Interactive Maps</h3>
            <p className="text-sm text-[#8197a4] leading-relaxed">
              Choose from VIP Balcony Recliners, Prime Middle view, or Value Lower seats with precise real-time pricing and visual auditorium layouts.
            </p>
          </div>

          <div className="bg-[#1a242f] border border-[#2a3b4c] p-8 rounded-2xl hover:border-[#00a8e1]/60 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 bg-[#00a8e1]/10 rounded-xl flex items-center justify-center text-[#00a8e1] border border-[#00a8e1]/30">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Digital Boarding Passes</h3>
            <p className="text-sm text-[#8197a4] leading-relaxed">
              Access your QR code e-ticket pass anywhere, anytime. Print ticket receipts or present them right from your phone at the cinema gate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
