import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieCarousel = ({ title, subtitle, movies = [], isHorizontal = false }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -600 : 600;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative my-8 sm:my-12 group/carousel">
      {/* Title & Subtitle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>{title}</span>
            <span className="text-[#00a8e1] text-lg font-normal">›</span>
          </h2>
          {subtitle && <p className="text-xs sm:text-sm text-[#8197a4] mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-16 sm:h-24 bg-black/70 hover:bg-[#00a8e1] text-white flex items-center justify-center rounded-r-lg backdrop-blur-sm transition-all duration-200 border-r border-y border-[#2a3b4c]/80 shadow-2xl opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex space-x-4 sm:space-x-5 overflow-x-auto no-scrollbar py-4 px-4 sm:px-6 lg:px-8 scroll-smooth"
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} isHorizontal={isHorizontal} />
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-16 sm:h-24 bg-black/70 hover:bg-[#00a8e1] text-white flex items-center justify-center rounded-l-lg backdrop-blur-sm transition-all duration-200 border-l border-y border-[#2a3b4c]/80 shadow-2xl opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieCarousel;
