import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0f171e] border-t border-[#2a3b4c]/60 pt-12 pb-8 mt-20 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex justify-center items-baseline font-black tracking-tight text-2xl text-white mb-6">
          <span className="text-[#00a8e1] font-extrabold">i</span>
          <span className="tracking-tighter">Movies</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1] ml-0.5"></span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-[#00a8e1] font-medium mb-6">
          <Link to="/landing" className="hover:underline">
            Terms and Privacy Notice
          </Link>
          <a href="#feedback" onClick={(e) => { e.preventDefault(); alert("Thank you for your feedback! iMovies Prime is dedicated to world-class cinema experiences."); }} className="hover:underline">
            Send Us Feedback
          </a>
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Help & Support: support@imovies.com | 24/7 Concierge Available"); }} className="hover:underline">
            Help & FAQ
          </a>
          <Link to="/home" className="hover:underline">
            Browse Catalog
          </Link>
        </div>

        {/* Prime Feature Chips */}
        <div className="flex flex-wrap justify-center gap-3 text-[11px] text-[#8197a4] mb-6">
          <span className="bg-[#1a242f] px-3 py-1 rounded border border-[#2a3b4c]">Dolby Atmos Sound</span>
          <span className="bg-[#1a242f] px-3 py-1 rounded border border-[#2a3b4c]">4K Laser IMAX</span>
          <span className="bg-[#1a242f] px-3 py-1 rounded border border-[#2a3b4c]">Live Seat Locking TTL</span>
          <span className="bg-[#1a242f] px-3 py-1 rounded border border-[#2a3b4c]">Paperless QR Passes</span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-[#8197a4]/80">
          © 2026 iMovies Entertainment Inc. All rights reserved. Amazon Prime Video aesthetic tribute edition.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
