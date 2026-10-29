import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import {
  Ticket,
  ChevronLeft,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import TicketCard from '../../components/TicketCard';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = '/bookings/admin/all?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await api.get(url);
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
        setTotalRevenue(res.data.totalRevenue || 0);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to retrieve platform reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${bookingId} and release seats?`)) {
      return;
    }

    try {
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data?.success) {
        toast.success(`Booking ${bookingId} cancelled and auditorium seats released.`);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#2a3b4c] gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-[#1a242f] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Reservations</h1>
              <p className="text-xs sm:text-sm text-[#8197a4] mt-0.5">
                Complete audit log of all patron seat reservations and financial settlement records
              </p>
            </div>
          </div>

          <div className="bg-[#1a242f] px-5 py-2.5 rounded-2xl border border-[#2a3b4c] flex items-center space-x-3">
            <div>
              <p className="text-[10px] text-[#8197a4] uppercase font-bold">Total Platform Revenue</p>
              <p className="text-xl font-black text-[#00a8e1]">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <button
              onClick={fetchBookings}
              title="Refresh"
              className="p-2 rounded-lg bg-[#0f171e] hover:bg-[#253342] text-[#8197a4] hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#1a242f] p-4 sm:p-5 rounded-2xl border border-[#2a3b4c] flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by Booking ID, Email, Movie, Theatre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f171e] text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
            />
            <Search className="w-4 h-4 text-[#8197a4] absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#8197a4] uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-[#00a8e1]" />
              <span>Status:</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0f171e] text-white text-xs px-3 py-2 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
            >
              <option value="All">All Reservations</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f171e] text-[#8197a4] uppercase font-bold tracking-wider border-b border-[#2a3b4c]">
                <tr>
                  <th className="py-3.5 px-6">Booking ID</th>
                  <th className="py-3.5 px-6">Patron / User</th>
                  <th className="py-3.5 px-6">Movie & Show</th>
                  <th className="py-3.5 px-6">Theatre</th>
                  <th className="py-3.5 px-6">Seats</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3b4c]/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8197a4]">
                      <div className="w-8 h-8 border-3 border-[#00a8e1] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading platform reservations...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8197a4]">
                      No matching reservations found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id || b.bookingId} className="hover:bg-[#253342] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">{b.bookingId}</td>
                      <td className="py-4 px-6 text-[#8197a4]">
                        <p className="font-semibold text-white">{b.userEmail}</p>
                        <p className="text-[10px]">{b.paymentMethod}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">{b.movieName}</p>
                        <p className="text-[10px] text-[#8197a4]">
                          {b.showTime} • {b.showDate ? new Date(b.showDate).toLocaleDateString() : 'Today'}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-[#8197a4]">{b.theatreName}</td>
                      <td className="py-4 px-6 font-bold text-[#00a8e1]">
                        {b.selectedSeats?.join(', ')}
                      </td>
                      <td className="py-4 px-6 font-black text-white">₹{b.totalAmount}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.paymentStatus === 'Completed'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950/80 text-red-400 border border-red-800'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setSelectedTicket(b)}
                          title="Inspect Ticket Pass"
                          className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-[#00a8e1] text-[#8197a4] hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.paymentStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(b.bookingId)}
                            title="Cancel & Release Seats"
                            className="p-1.5 rounded-lg bg-[#0f171e] hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Inspector Modal */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedTicket(null)}
        >
          <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <TicketCard booking={selectedTicket} onCancel={handleCancelBooking} />
            <button
              onClick={() => setSelectedTicket(null)}
              className="mt-3 w-full bg-[#1a242f] hover:bg-[#253342] text-white py-2 rounded-xl text-xs font-bold border border-[#2a3b4c]"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
