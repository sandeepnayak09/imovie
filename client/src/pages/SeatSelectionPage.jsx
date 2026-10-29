import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Clock,
  Ticket,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  Film,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import SeatGrid from '../components/SeatGrid';
import PaymentModal from '../components/PaymentModal';

const SeatSelectionPage = () => {
  const { showId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLocking, setIsLocking] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // TTL Countdown Timer State
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerRef = useRef(null);

  // Fetch show details & current seat map
  const fetchShowDetails = async () => {
    try {
      const res = await api.get(`/shows/${showId}`);
      if (res.data?.success) {
        setShow(res.data.show);
      }
    } catch (err) {
      console.error('Failed to load show seat map:', err);
      toast.error('Failed to load auditorium seating layout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowDetails();
    // Poll seat map every 15s to update real-time lock states from other users
    const pollInterval = setInterval(fetchShowDetails, 15000);
    return () => clearInterval(pollInterval);
  }, [showId]);

  // Handle countdown timer for seat lock TTL
  useEffect(() => {
    if (!lockExpiresAt) {
      setSecondsRemaining(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(lockExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(timerRef.current);
        toast.warning('Seat reservation lock expired. Releasing seats.');
        setIsPaymentOpen(false);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        fetchShowDetails();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockExpiresAt]);

  // Clean up user lock on unmount
  useEffect(() => {
    return () => {
      if (selectedSeats.length > 0 && user?.email) {
        api.post('/bookings/unlock-seats', {
          showId,
          selectedSeats,
          userEmail: user.email,
        }).catch(() => {});
      }
    };
  }, [selectedSeats, showId, user]);

  const handleSeatClick = (ticket) => {
    if (ticket.status === 'booked') return;

    if (ticket.status === 'locked' && ticket.lockedBy !== user?.email) {
      toast.info('This seat is currently held in checkout by another customer.');
      return;
    }

    const seatId = ticket.seatId;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Maximum 8 tickets allowed per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Pricing calculation
  const seatDetails = selectedSeats.map((seatId) => {
    const t = show?.tickets ? show.tickets[seatId] : null;
    return {
      seatId,
      tier: t?.tier || 'Middle',
      price: t?.price || 350,
    };
  });

  const subtotal = seatDetails.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.05);
  const taxes = Math.round(subtotal * 0.03);
  const totalAmount = subtotal + convenienceFee + taxes;

  // Lock Seats & Open Payment Modal
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to proceed with booking.');
      navigate('/login', { state: { from: `/seatslug/${showId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to proceed.');
      return;
    }

    try {
      setIsLocking(true);
      const res = await api.post('/bookings/lock-seats', {
        showId: show.showId || show._id,
        selectedSeats,
        userEmail: user.email,
      });

      if (res.data?.success) {
        setLockExpiresAt(res.data.lockExpiresAt);
        toast.success(`Seats locked for ${Math.floor(res.data.ttlSeconds / 60)} minutes!`);
        setIsPaymentOpen(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Seat lock failed.';
      toast.error(msg);
      // Refresh seat map to reflect current state
      fetchShowDetails();
    } finally {
      setIsLocking(false);
    }
  };

  // Confirm Payment & Complete Booking
  const handleConfirmPayment = async (paymentData) => {
    try {
      setIsProcessingPayment(true);
      const res = await api.post('/bookings/confirm', {
        showId: show.showId || show._id,
        selectedSeats,
        userEmail: user.email,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
      });

      if (res.data?.success) {
        toast.success('Booking confirmed! Generating your Prime ticket...');
        setIsPaymentOpen(false);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        navigate('/bookings', { state: { newBooking: res.data.booking } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment confirmation failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Format seconds mm:ss
  const formatTime = (secs) => {
    if (secs === null) return '05:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
          Initializing Auditorium Seating Layout...
        </p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center text-center p-6 pt-24">
        <Film className="w-16 h-16 text-[#8197a4] opacity-50 mb-4" />
        <h2 className="text-2xl font-bold text-white">Showtime Not Found</h2>
        <p className="text-sm text-[#8197a4] mt-2 mb-6">This show schedule may have concluded or been updated.</p>
        <Link to="/home" className="bg-[#00a8e1] text-white px-6 py-2.5 rounded-lg text-sm font-bold">
          Browse Active Shows
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-20 pb-36">
      {/* Top Header Bar */}
      <div className="bg-[#1a242f] border-b border-[#2a3b4c] sticky top-16 sm:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                  {show.movieName}
                </h1>
                <span className="text-[10px] bg-[#00a8e1] text-white font-extrabold px-1.5 py-0.5 rounded">
                  {show.screenFormat || 'IMAX'}
                </span>
              </div>
              <p className="text-xs text-[#8197a4] truncate">
                {show.theatreName} • {show.showTime} • {show.showDate ? new Date(show.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
              </p>
            </div>
          </div>

          {/* Right Status & TTL Timer */}
          <div className="flex items-center space-x-3">
            {lockExpiresAt ? (
              <div className="flex items-center space-x-2 bg-amber-950/80 border border-amber-500/80 text-amber-400 px-3 py-1.5 rounded-xl font-mono text-xs font-bold animate-pulse">
                <Clock className="w-4 h-4" />
                <span>Seats Held: {formatTime(secondsRemaining)}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#8197a4]">
                <ShieldCheck className="w-4 h-4 text-[#00a8e1]" />
                <span>5-min Live Lock Guarantee</span>
              </div>
            )}

            <button
              onClick={fetchShowDetails}
              title="Refresh seat availability"
              className="p-2 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auditorium Seat Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <SeatGrid
          tickets={show.tickets || {}}
          selectedSeats={selectedSeats}
          onSeatClick={handleSeatClick}
          currentUserEmail={user?.email}
        />
      </div>

      {/* Floating Checkout Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a242f]/95 backdrop-blur-md border-t border-[#2a3b4c] shadow-2xl py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left summary */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#8197a4] uppercase font-bold tracking-wider">
                Selected Seats ({selectedSeats.length}):
              </span>
              <span className="text-sm font-extrabold text-white">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
              </span>
            </div>

            {selectedSeats.length > 0 && (
              <div className="flex items-center space-x-3 text-xs text-[#8197a4]">
                <span>Tickets: ₹{subtotal}</span>
                <span>•</span>
                <span>Fees & Taxes: ₹{convenienceFee + taxes}</span>
              </div>
            )}
          </div>

          {/* Right Action */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] text-[#8197a4] uppercase font-bold tracking-wider">Total Amount</p>
              <p className="text-xl sm:text-2xl font-black text-[#00a8e1]">₹{totalAmount}</p>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={selectedSeats.length === 0 || isLocking}
              className="flex items-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-xl hover:shadow-cyanGlow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ticket className="w-4 h-4" />
              <span>{isLocking ? 'Locking Seats...' : 'Book Selected Seats'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        show={show}
        selectedSeats={selectedSeats}
        seatDetails={seatDetails}
        totalAmount={totalAmount}
        convenienceFee={convenienceFee}
        taxes={taxes}
        onConfirmPayment={handleConfirmPayment}
        onPaymentSuccess={(confirmedBooking) => {
          setIsPaymentOpen(false);
          setLockExpiresAt(null);
          setSelectedSeats([]);
          navigate('/bookings', { state: { newBooking: confirmedBooking } });
        }}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
};

export default SeatSelectionPage;
