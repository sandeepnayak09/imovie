import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Ticket, Film, Sparkles, AlertCircle } from 'lucide-react';
import TicketCard from '../components/TicketCard';

const UserBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-bookings');
      if (res.data?.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err);
      toast.error('Failed to retrieve ticket history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation and release your seats?')) {
      return;
    }

    try {
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data?.success) {
        toast.success('Reservation cancelled and seats released successfully.');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#2a3b4c] gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black text-white bg-[#00a8e1] px-2 py-0.5 rounded">
                Prime Pass
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Movie Tickets
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#8197a4] mt-1">
              Your confirmed digital boarding passes with scan-ready QR codes
            </p>
          </div>

          <Link
            to="/home"
            className="self-start sm:self-auto flex items-center space-x-2 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:shadow-cyanGlow"
          >
            <Ticket className="w-4 h-4" />
            <span>Book New Show</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[#8197a4] uppercase tracking-wider">
              Retrieving Digital Passes...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-[#1a242f] border border-[#2a3b4c] rounded-3xl p-12 text-center space-y-4">
            <Film className="w-16 h-16 text-[#8197a4] mx-auto opacity-50" />
            <h3 className="text-xl font-bold text-white">No Bookings Yet</h3>
            <p className="text-xs sm:text-sm text-[#8197a4] max-w-md mx-auto">
              You haven't reserved any movie tickets yet. Browse current blockbuster releases and book your favorite seats!
            </p>
            <Link
              to="/home"
              className="inline-block bg-[#00a8e1] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-cyanGlow transition-all"
            >
              Browse Now In Theatres
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {bookings.map((booking) => (
              <TicketCard
                key={booking._id || booking.bookingId}
                booking={booking}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookingsPage;
