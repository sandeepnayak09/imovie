import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const TrailerModal = ({ isOpen, onClose, trailerUrl, movieName }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format embed url with autoplay
  const embedUrl = trailerUrl?.includes('embed')
    ? `${trailerUrl}?autoplay=1&rel=0`
    : trailerUrl?.replace('watch?v=', 'embed/') + '?autoplay=1&rel=0';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3b4c] bg-[#0f171e]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00a8e1] bg-[#00a8e1]/10 px-2 py-0.5 rounded border border-[#00a8e1]/30">
              Official Trailer
            </span>
            <h3 className="text-base font-bold text-white truncate max-w-md sm:max-w-lg">
              {movieName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8197a4] hover:text-white p-1 rounded-full hover:bg-[#253342] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={`${movieName} Trailer`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
