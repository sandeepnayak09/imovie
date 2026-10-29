import React from 'react';
import { Armchair, Lock, CheckCircle2 } from 'lucide-react';

const SeatGrid = ({
  tickets = {},
  selectedSeats = [],
  onSeatClick,
  currentUserEmail,
}) => {
  // Group seats by tier and rows
  // Structure: { Balcony: { A: [seatObj, ...], B: [...] }, Middle: { ... }, Lower: { ... } }
  const tiers = {
    Balcony: {},
    Middle: {},
    Lower: {},
  };

  const tierPrices = {
    Balcony: 0,
    Middle: 0,
    Lower: 0,
  };

  // Populate tiers
  Object.values(tickets).forEach((ticket) => {
    const tier = ticket.tier || 'Middle';
    const row = ticket.seatId.charAt(0);

    if (!tiers[tier]) tiers[tier] = {};
    if (!tiers[tier][row]) tiers[tier][row] = [];

    tiers[tier][row].push(ticket);

    if (!tierPrices[tier] || tierPrices[tier] < ticket.price) {
      tierPrices[tier] = ticket.price;
    }
  });

  // Sort rows and seats numerically
  Object.keys(tiers).forEach((tierName) => {
    Object.keys(tiers[tierName]).forEach((rowKey) => {
      tiers[tierName][rowKey].sort((a, b) => {
        const numA = parseInt(a.seatId.slice(1), 10);
        const numB = parseInt(b.seatId.slice(1), 10);
        return numA - numB;
      });
    });
  });

  const getSeatStatus = (ticket) => {
    if (!ticket) return 'available';

    // Check if booked
    if (ticket.status === 'booked') return 'booked';

    // Check if locked
    if (ticket.status === 'locked') {
      // If locked by this current user, consider it selected/held
      if (currentUserEmail && ticket.lockedBy === currentUserEmail) {
        return 'selected';
      }
      return 'locked';
    }

    // Check if currently selected by user in UI state
    if (selectedSeats.includes(ticket.seatId)) {
      return 'selected';
    }

    return 'available';
  };

  return (
    <div className="w-full flex flex-col items-center select-none overflow-x-auto py-6 px-2">
      {/* Curved Screen Indicator */}
      <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
        <div className="w-full h-8 auditorium-screen flex items-center justify-center">
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-[#00a8e1] drop-shadow-md">
            All Eyes This Way • Cinema Screen
          </span>
        </div>
        <div className="w-3/4 h-2 bg-gradient-to-b from-[#00a8e1]/20 to-transparent blur-sm rounded-full mt-1"></div>
      </div>

      {/* Seat Map Tiers */}
      <div className="w-full max-w-4xl space-y-10">
        {Object.entries(tiers).map(([tierName, rows]) => {
          if (Object.keys(rows).length === 0) return null;
          const price = tierPrices[tierName];

          return (
            <div
              key={tierName}
              className="bg-[#1a242f]/50 border border-[#2a3b4c]/60 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2a3b4c]/60">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tierName === 'Balcony'
                        ? 'bg-amber-400'
                        : tierName === 'Middle'
                        ? 'bg-[#00a8e1]'
                        : 'bg-emerald-400'
                    }`}
                  ></span>
                  <h3 className="font-bold text-sm sm:text-base text-white tracking-wide uppercase">
                    {tierName} Class
                  </h3>
                  <span className="text-xs text-[#8197a4]">
                    {tierName === 'Balcony'
                      ? '(Premium Recliner)'
                      : tierName === 'Middle'
                      ? '(Prime Center View)'
                      : '(Standard Value)'}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[#00a8e1] bg-[#00a8e1]/10 px-3 py-1 rounded-full border border-[#00a8e1]/30">
                  ₹{price}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-3 flex flex-col items-center">
                {Object.keys(rows)
                  .sort()
                  .map((rowLetter) => (
                    <div key={rowLetter} className="flex items-center justify-center space-x-1 sm:space-x-2">
                      {/* Row Label Left */}
                      <span className="w-5 text-center text-xs font-bold text-[#8197a4]">
                        {rowLetter}
                      </span>

                      {/* Seats in Row */}
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        {rows[rowLetter].map((ticket, idx) => {
                          const status = getSeatStatus(ticket);
                          const isSelected = selectedSeats.includes(ticket.seatId);
                          const seatNumber = ticket.seatId.slice(1);

                          // Add visual aisle gap in the middle
                          const totalSeats = rows[rowLetter].length;
                          const showAisle = idx === Math.floor(totalSeats / 2);

                          return (
                            <React.Fragment key={ticket.seatId}>
                              {showAisle && <div className="w-4 sm:w-8" />}
                              <button
                                type="button"
                                disabled={status === 'booked' || status === 'locked'}
                                onClick={() => onSeatClick(ticket)}
                                title={`Seat ${ticket.seatId} (${tierName}) - ₹${ticket.price} [${status.toUpperCase()}]`}
                                className={`group relative w-7 h-7 sm:w-9 sm:h-9 rounded-t-lg rounded-b-md flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-200 border ${
                                  status === 'booked'
                                    ? 'bg-[#18212b] border-[#2a3b4c]/40 text-[#4a5d6e] cursor-not-allowed opacity-50'
                                    : status === 'locked'
                                    ? 'bg-amber-950/60 border-amber-600/80 text-amber-400 cursor-not-allowed animate-pulse shadow-sm'
                                    : isSelected
                                    ? 'bg-[#00a8e1] border-[#00a8e1] text-white shadow-cyanGlow scale-110 z-10'
                                    : 'bg-[#1a242f] border-[#2a3b4c] text-gray-300 hover:border-[#00a8e1] hover:text-white hover:scale-105'
                                }`}
                              >
                                {status === 'booked' ? (
                                  <span className="line-through">✕</span>
                                ) : status === 'locked' ? (
                                  <Lock className="w-3 h-3 text-amber-400" />
                                ) : (
                                  seatNumber
                                )}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Row Label Right */}
                      <span className="w-5 text-center text-xs font-bold text-[#8197a4]">
                        {rowLetter}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#8197a4] bg-[#1a242f] px-6 py-3 rounded-xl border border-[#2a3b4c]">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#1a242f] border border-[#2a3b4c]"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#00a8e1] border border-[#00a8e1] shadow-cyanGlow"></div>
          <span className="text-white font-semibold">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-500"></div>
          <span className="text-amber-400">Locked (TTL)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#18212b] border border-[#2a3b4c]/40 opacity-60"></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
