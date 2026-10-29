import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { Building, ChevronLeft, Sparkles, Plus, MapPin } from 'lucide-react';

const AddTheatrePage = () => {
  const navigate = useNavigate();

  const [theatreName, setTheatreName] = useState('');
  const [location, setLocation] = useState('');
  const [balconySeatPrice, setBalconySeatPrice] = useState('500');
  const [middleSeatPrice, setMiddleSeatPrice] = useState('350');
  const [lowerSeatPrice, setLowerSeatPrice] = useState('220');

  const [balconyRows, setBalconyRows] = useState('A, B');
  const [balconySeatsPerRow, setBalconySeatsPerRow] = useState('10');

  const [middleRows, setMiddleRows] = useState('C, D, E');
  const [middleSeatsPerRow, setMiddleSeatsPerRow] = useState('12');

  const [lowerRows, setLowerRows] = useState('F, G');
  const [lowerSeatsPerRow, setLowerSeatsPerRow] = useState('12');

  const [facilities, setFacilities] = useState('Dolby Atmos 7.1, 4K Laser Projection, VIP Recliners, Gourmet Dining');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFillSample = () => {
    setTheatreName('Miraj Cinemas IMAX, City Center Mall');
    setLocation('Salt Lake Sector V, Kolkata');
    setBalconySeatPrice('520');
    setMiddleSeatPrice('360');
    setLowerSeatPrice('240');
    setBalconyRows('A, B');
    setBalconySeatsPerRow('10');
    setMiddleRows('C, D, E');
    setMiddleSeatsPerRow('12');
    setLowerRows('F, G');
    setLowerSeatsPerRow('12');
    setFacilities('IMAX with Laser, Dolby Atmos 7.1, Plush Leather Recliners, Live Concessions');
    toast.info('Sample multiplex venue filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!theatreName || !location || !balconySeatPrice || !middleSeatPrice || !lowerSeatPrice) {
      toast.error('Please complete all theatre parameters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/theatre', {
        theatreName,
        location,
        balconySeatPrice: Number(balconySeatPrice),
        middleSeatPrice: Number(middleSeatPrice),
        lowerSeatPrice: Number(lowerSeatPrice),
        balconySeats: {
          rows: balconyRows.split(',').map((r) => r.trim().toUpperCase()),
          seatsPerRow: Number(balconySeatsPerRow) || 10,
        },
        middleSeats: {
          rows: middleRows.split(',').map((r) => r.trim().toUpperCase()),
          seatsPerRow: Number(middleSeatsPerRow) || 12,
        },
        lowerSeats: {
          rows: lowerRows.split(',').map((r) => r.trim().toUpperCase()),
          seatsPerRow: Number(lowerSeatsPerRow) || 12,
        },
        facilities: facilities.split(',').map((f) => f.trim()),
      });

      if (res.data?.success) {
        toast.success(`Theatre "${theatreName}" registered successfully!`);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register theatre.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#2a3b4c]">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-[#1a242f] hover:bg-[#253342] text-[#8197a4] hover:text-white border border-[#2a3b4c] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Register Theatre Venue</h1>
              <p className="text-xs text-[#8197a4] mt-0.5">Configure venue details and tier-based seating specifications</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            className="flex items-center space-x-1.5 bg-[#00a8e1]/10 text-[#00a8e1] border border-[#00a8e1]/30 hover:bg-[#00a8e1]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Sample Theatre</span>
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#1a242f] border border-[#2a3b4c] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Theatre Name */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Theatre / Multiplex Name *
              </label>
              <input
                type="text"
                required
                value={theatreName}
                onChange={(e) => setTheatreName(e.target.value)}
                placeholder="PVR Directors Cut, Mall..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                City / Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="South Delhi, Mumbai, Bengaluru..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>

            {/* Tier Pricing Section */}
            <div className="sm:col-span-2 pt-2 border-t border-[#2a3b4c]">
              <h3 className="text-sm font-bold text-white mb-3">Tier-Based Seat Pricing (INR)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-amber-400 mb-1">
                    Balcony Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={balconySeatPrice}
                    onChange={(e) => setBalconySeatPrice(e.target.value)}
                    className="w-full bg-[#0f171e] text-white text-sm px-3 py-2 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#00a8e1] mb-1">
                    Middle Class Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={middleSeatPrice}
                    onChange={(e) => setMiddleSeatPrice(e.target.value)}
                    className="w-full bg-[#0f171e] text-white text-sm px-3 py-2 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Lower Class Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={lowerSeatPrice}
                    onChange={(e) => setLowerSeatPrice(e.target.value)}
                    className="w-full bg-[#0f171e] text-white text-sm px-3 py-2 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
              </div>
            </div>

            {/* Tier Layouts */}
            <div className="sm:col-span-2 pt-2 border-t border-[#2a3b4c]">
              <h3 className="text-sm font-bold text-white mb-3">Auditorium Seating Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Balcony */}
                <div className="bg-[#0f171e] p-3.5 rounded-xl border border-[#2a3b4c] space-y-2">
                  <p className="text-xs font-bold text-amber-400">Balcony Rows</p>
                  <input
                    type="text"
                    value={balconyRows}
                    onChange={(e) => setBalconyRows(e.target.value)}
                    placeholder="A, B"
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                  <p className="text-[11px] text-[#8197a4]">Seats per row</p>
                  <input
                    type="number"
                    value={balconySeatsPerRow}
                    onChange={(e) => setBalconySeatsPerRow(e.target.value)}
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                </div>

                {/* Middle */}
                <div className="bg-[#0f171e] p-3.5 rounded-xl border border-[#2a3b4c] space-y-2">
                  <p className="text-xs font-bold text-[#00a8e1]">Middle Rows</p>
                  <input
                    type="text"
                    value={middleRows}
                    onChange={(e) => setMiddleRows(e.target.value)}
                    placeholder="C, D, E"
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                  <p className="text-[11px] text-[#8197a4]">Seats per row</p>
                  <input
                    type="number"
                    value={middleSeatsPerRow}
                    onChange={(e) => setMiddleSeatsPerRow(e.target.value)}
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                </div>

                {/* Lower */}
                <div className="bg-[#0f171e] p-3.5 rounded-xl border border-[#2a3b4c] space-y-2">
                  <p className="text-xs font-bold text-emerald-400">Lower Rows</p>
                  <input
                    type="text"
                    value={lowerRows}
                    onChange={(e) => setLowerRows(e.target.value)}
                    placeholder="F, G"
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                  <p className="text-[11px] text-[#8197a4]">Seats per row</p>
                  <input
                    type="number"
                    value={lowerSeatsPerRow}
                    onChange={(e) => setLowerSeatsPerRow(e.target.value)}
                    className="w-full bg-[#1a242f] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2a3b4c]"
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#8197a4] uppercase tracking-wider mb-1.5">
                Amenities & Sound Specs (Comma-separated)
              </label>
              <input
                type="text"
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                placeholder="Dolby Atmos, 4K Projection, Recliners..."
                className="w-full bg-[#0f171e] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2a3b4c] focus:outline-none focus:border-[#00a8e1]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#2a3b4c] flex justify-end space-x-3">
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl bg-[#0f171e] hover:bg-[#253342] text-xs font-bold text-gray-300 border border-[#2a3b4c] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 bg-[#00a8e1] hover:bg-[#1b9ce2] text-white px-7 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-cyanGlow transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Venue...' : 'Save & Configure Theatre'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTheatrePage;
