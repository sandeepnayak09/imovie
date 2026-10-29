import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Calendar, Clock, MapPin, Printer, Film, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';

const TicketCard = ({ booking, onCancel }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (booking?.bookingId) {
      QRCode.toDataURL(
        `iMovies-Booking:${booking.bookingId}|Movie:${booking.movieName}|Seats:${booking.selectedSeats?.join(',')}`,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        }
      )
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [booking]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCancelled = booking.paymentStatus === 'Cancelled';

  return (
    <div className="w-full max-w-xl mx-auto my-6 bg-[#1a242f] border border-[#2a3b4c] rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Prime Header Bar */}
      <div className="bg-gradient-to-r from-[#00a8e1] to-[#0077b6] px-6 py-3 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Ticket className="w-5 h-5" />
          <span className="font-extrabold tracking-wide uppercase text-xs">
            iMovies Prime Digital Pass
          </span>
        </div>
        <span className="text-xs font-bold bg-black/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
          {booking.bookingId}
        </span>
      </div>

      <div id="printable-ticket" className="p-6 sm:p-8 space-y-6">
        {/* Main Movie & Venue Block */}
        <div className="flex flex-col sm:flex-row gap-6">
          {booking.moviePoster && (
            <img
              src={booking.moviePoster}
              alt={booking.movieName}
              className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-xl shadow-lg border border-[#2a3b4c] flex-shrink-0"
            />
          )}

          <div className="space-y-2 flex-1">
            <div className="flex items-start justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {booking.movieName}
              </h2>
              {isCancelled ? (
                <span className="text-xs font-bold text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-800">
                  Cancelled
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Confirmed
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-[#00a8e1] font-semibold">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{booking.theatreName}</span>
            </div>
            {booking.theatreLocation && (
              <p className="text-xs text-[#8197a4] pl-5">{booking.theatreLocation}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-white">
              <div className="flex items-center space-x-2 bg-[#0f171e] p-2 rounded-lg border border-[#2a3b4c]/60">
                <Calendar className="w-4 h-4 text-[#00a8e1]" />
                <div>
                  <p className="text-[10px] text-[#8197a4] uppercase font-bold">Date</p>
                  <p className="font-semibold">
                    {booking.showDate
                      ? new Date(booking.showDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Today'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-[#0f171e] p-2 rounded-lg border border-[#2a3b4c]/60">
                <Clock className="w-4 h-4 text-[#00a8e1]" />
                <div>
                  <p className="text-[10px] text-[#8197a4] uppercase font-bold">Showtime</p>
                  <p className="font-semibold">{booking.showTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative py-2">
          <div className="border-t-2 border-dashed border-[#2a3b4c]"></div>
          {/* Half-circles on edges to simulate ticket punch */}
          <div className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#0f171e] rounded-full border-r border-[#2a3b4c]"></div>
          <div className="absolute -right-10 sm:-right-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#0f171e] rounded-full border-l border-[#2a3b4c]"></div>
        </div>

        {/* Seat Breakdown & QR Code Pass */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 flex-1 w-full">
            <div>
              <p className="text-[11px] text-[#8197a4] uppercase font-bold tracking-wider">
                Reserved Seats ({booking.selectedSeats?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {booking.selectedSeats?.map((seat) => (
                  <span
                    key={seat}
                    className="bg-[#00a8e1] text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-[#8197a4] space-y-1">
              <div className="flex justify-between">
                <span>Total Amount Paid:</span>
                <span className="font-extrabold text-white text-sm">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="text-white">{booking.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Booked On:</span>
                <span className="text-white">
                  {new Date(booking.bookingDate || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Pass */}
          <div className="flex flex-col items-center bg-white p-2.5 rounded-xl shadow-lg border border-gray-300 flex-shrink-0">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Ticket QR Pass" className="w-24 h-24 sm:w-28 sm:h-28" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 animate-pulse rounded"></div>
            )}
            <span className="text-[9px] font-mono text-gray-700 font-bold mt-1 tracking-wider uppercase">
              Scan at Gate
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Footer Actions */}
      <div className="bg-[#0f171e] px-6 py-4 border-t border-[#2a3b4c] flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 text-xs font-semibold text-[#00a8e1] hover:text-[#1b9ce2] transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Ticket Pass</span>
        </button>

        {!isCancelled && onCancel && (
          <button
            onClick={() => onCancel(booking.bookingId)}
            className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline transition-colors"
          >
            Cancel Booking & Release Seats
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketCard;
