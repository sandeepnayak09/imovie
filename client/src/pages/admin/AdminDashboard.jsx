import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Film,
  Building,
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  PlusCircle,
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeMovies: 0,
    totalTheatres: 0,
    totalShows: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, moviesRes, theatresRes, showsRes] = await Promise.all([
          api.get('/bookings/admin/all'),
          api.get('/movie'),
          api.get('/theatre'),
          api.get('/shows'),
        ]);

        const bookings = bookingsRes.data?.bookings || [];
        const totalRevenue = bookingsRes.data?.totalRevenue || 0;

        setStats({
          totalRevenue,
          totalBookings: bookings.length,
          activeMovies: moviesRes.data?.count || 0,
          totalTheatres: theatresRes.data?.count || 0,
          totalShows: showsRes.data?.count || 0,
        });

        setRecentBookings(bookings.slice(0, 6));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#2a3b4c] gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-white bg-amber-500 px-2 py-0.5 rounded shadow">
                Console
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Admin Management Portal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#8197a4] mt-1">
              Live operational metrics, catalog controls, auditorium scheduling & seat locking oversight
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/addmovie"
              className="flex items-center space-x-1.5 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow hover:shadow-cyanGlow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Movie</span>
            </Link>
            <Link
              to="/addshow"
              className="flex items-center space-x-1.5 bg-[#1a242f] hover:bg-[#253342] text-white border border-[#2a3b4c] px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#00a8e1]" />
              <span>Schedule Show</span>
            </Link>
          </div>
        </div>

        {/* Metrics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#1a242f] border border-[#2a3b4c] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#00a8e1]/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">Total Platform Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3">₹{stats.totalRevenue.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live Completed Sales</span>
            </span>
          </div>

          <div className="bg-[#1a242f] border border-[#2a3b4c] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#00a8e1]/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">Total Reservations</span>
              <div className="w-9 h-9 rounded-xl bg-[#00a8e1]/10 text-[#00a8e1] flex items-center justify-center border border-[#00a8e1]/20">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3">{stats.totalBookings}</p>
            <Link to="/adminbookings" className="text-[11px] text-[#00a8e1] hover:underline font-semibold mt-1 inline-flex items-center space-x-1">
              <span>View all transactions</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#1a242f] border border-[#2a3b4c] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#00a8e1]/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">Active Films</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Film className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3">{stats.activeMovies}</p>
            <Link to="/addmovie" className="text-[11px] text-amber-400 hover:underline font-semibold mt-1 inline-flex items-center space-x-1">
              <span>Manage catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#1a242f] border border-[#2a3b4c] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#00a8e1]/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8197a4]">Theatres & Multiplexes</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3">{stats.totalTheatres}</p>
            <Link to="/addtheatre" className="text-[11px] text-purple-400 hover:underline font-semibold mt-1 inline-flex items-center space-x-1">
              <span>Add theatre venue</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/addmovie"
            className="bg-[#1a242f] hover:bg-[#253342] border border-[#2a3b4c] hover:border-[#00a8e1] p-5 rounded-2xl transition-all shadow group"
          >
            <Film className="w-6 h-6 text-[#00a8e1] mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-white">Add Movie</h3>
            <p className="text-xs text-[#8197a4] mt-1">Register new film with poster, genres, and metadata</p>
          </Link>

          <Link
            to="/addtheatre"
            className="bg-[#1a242f] hover:bg-[#253342] border border-[#2a3b4c] hover:border-[#00a8e1] p-5 rounded-2xl transition-all shadow group"
          >
            <Building className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-white">Add Theatre</h3>
            <p className="text-xs text-[#8197a4] mt-1">Configure Balcony, Middle, and Lower tier layouts</p>
          </Link>

          <Link
            to="/addshow"
            className="bg-[#1a242f] hover:bg-[#253342] border border-[#2a3b4c] hover:border-[#00a8e1] p-5 rounded-2xl transition-all shadow group"
          >
            <Calendar className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-white">Schedule Show</h3>
            <p className="text-xs text-[#8197a4] mt-1">Link movies to venues with date and time slots</p>
          </Link>

          <Link
            to="/adminbookings"
            className="bg-[#1a242f] hover:bg-[#253342] border border-[#2a3b4c] hover:border-[#00a8e1] p-5 rounded-2xl transition-all shadow group"
          >
            <Ticket className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-white">All Bookings</h3>
            <p className="text-xs text-[#8197a4] mt-1">Live ticket monitor, refund moderation, and auditing</p>
          </Link>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-[#2a3b4c] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Customer Reservations</h2>
              <p className="text-xs text-[#8197a4] mt-0.5">Live stream of ticket bookings across all multiplexes</p>
            </div>
            <Link
              to="/adminbookings"
              className="text-xs font-semibold text-[#00a8e1] hover:underline flex items-center space-x-1"
            >
              <span>View All ({stats.totalBookings})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f171e] text-[#8197a4] uppercase font-bold tracking-wider border-b border-[#2a3b4c]">
                <tr>
                  <th className="py-3 px-6">Booking ID</th>
                  <th className="py-3 px-6">User Email</th>
                  <th className="py-3 px-6">Movie</th>
                  <th className="py-3 px-6">Theatre</th>
                  <th className="py-3 px-6">Seats</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3b4c]/60">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8197a4]">
                      No bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b._id || b.bookingId} className="hover:bg-[#253342] transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-white">{b.bookingId}</td>
                      <td className="py-3.5 px-6 text-[#8197a4]">{b.userEmail}</td>
                      <td className="py-3.5 px-6 font-semibold text-white">{b.movieName}</td>
                      <td className="py-3.5 px-6 text-[#8197a4]">{b.theatreName}</td>
                      <td className="py-3.5 px-6 font-bold text-[#00a8e1]">{b.selectedSeats?.join(', ')}</td>
                      <td className="py-3.5 px-6 font-bold text-white">₹{b.totalAmount}</td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.paymentStatus === 'Completed'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950/80 text-red-400 border border-red-800'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
