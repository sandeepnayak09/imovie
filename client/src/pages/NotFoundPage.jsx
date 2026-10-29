import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0f171e] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#00a8e1]/10 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1] mb-6 shadow-cyanGlow">
        <Film className="w-10 h-10" />
      </div>

      <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Scene Not Found</h2>
      <p className="text-xs sm:text-sm text-[#8197a4] max-w-md mx-auto mb-8">
        The reel you are looking for has been cut from the final film. Let's return to the main screening room.
      </p>

      <div className="flex items-center space-x-3">
        <Link
          to="/home"
          className="flex items-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg hover:shadow-cyanGlow transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
