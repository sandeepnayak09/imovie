const { getIsConnected } = require('../config/db');
const { store, cleanupExpiredSeatLocks, SEAT_LOCK_TTL_MS } = require('../data/store');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const { getMovieDetails } = require('../services/tmdbService');
const {
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require('../services/emailService');

// @desc    Lock seats temporarily with TTL
// @route   POST /api/bookings/lock-seats
const lockSeats = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide showId and an array of selectedSeats.' });
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'User identification required to lock seats.' });
    }

    const now = Date.now();
    const lockExpiresAt = new Date(now + SEAT_LOCK_TTL_MS);

    if (getIsConnected()) {
      const show = await Show.findOne({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });

      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const conflictingSeats = [];

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) {
          conflictingSeats.push({ seatId, reason: 'Seat does not exist in this auditorium layout.' });
          continue;
        }

        if (ticket.status === 'booked') {
          conflictingSeats.push({ seatId, reason: 'Seat is already booked by another patron.' });
        } else if (ticket.status === 'locked' && ticket.lockedBy && ticket.lockedBy !== userEmail) {
          conflictingSeats.push({ seatId, reason: 'Seat is currently held in checkout by another customer.' });
        }
      }

      if (conflictingSeats.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Some of the selected seats are no longer available.',
          conflicts: conflictingSeats,
        });
      }

      // Apply lock
      for (const seatId of selectedSeats) {
        const currentTicket = show.tickets[seatId];
        show.tickets[seatId] = {
          ...currentTicket,
          status: 'locked',
          lockedBy: userEmail,
          lockedAt: new Date(now),
          lockExpiresAt,
        };
      }

      show.markModified('tickets');
      await show.save();

      return res.json({
        success: true,
        message: `Seats held securely for ${SEAT_LOCK_TTL_MS / 60000} minutes.`,
        lockedSeats: selectedSeats,
        lockExpiresAt,
        ttlSeconds: SEAT_LOCK_TTL_MS / 1000,
      });
    } else {
      // In-Memory store
      const show = store.shows.find((s) => s.showId === showId || s._id === showId);
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const conflictingSeats = [];

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) {
          conflictingSeats.push({ seatId, reason: 'Seat does not exist in this auditorium layout.' });
          continue;
        }

        if (ticket.status === 'booked') {
          conflictingSeats.push({ seatId, reason: 'Seat is already booked by another patron.' });
        } else if (ticket.status === 'locked' && ticket.lockedBy && ticket.lockedBy !== userEmail) {
          conflictingSeats.push({ seatId, reason: 'Seat is currently held in checkout by another customer.' });
        }
      }

      if (conflictingSeats.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Some of the selected seats are no longer available.',
          conflicts: conflictingSeats,
        });
      }

      // Apply lock
      for (const seatId of selectedSeats) {
        const currentTicket = show.tickets[seatId];
        show.tickets[seatId] = {
          ...currentTicket,
          status: 'locked',
          lockedBy: userEmail,
          lockedAt: new Date(now),
          lockExpiresAt,
        };
      }

      return res.json({
        success: true,
        message: `Seats held securely for ${SEAT_LOCK_TTL_MS / 60000} minutes.`,
        lockedSeats: selectedSeats,
        lockExpiresAt,
        ttlSeconds: SEAT_LOCK_TTL_MS / 1000,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error locking seats.' });
  }
};

// @desc    Release locked seats
// @route   POST /api/bookings/unlock-seats
const unlockSeats = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats)) {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    if (getIsConnected()) {
      const show = await Show.findOne({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });

      if (show && show.tickets) {
        for (const seatId of selectedSeats) {
          const t = show.tickets[seatId];
          if (t && t.status === 'locked' && (!userEmail || t.lockedBy === userEmail)) {
            show.tickets[seatId] = {
              ...t,
              status: 'available',
              lockedBy: null,
              lockedAt: null,
              lockExpiresAt: null,
            };
          }
        }
        show.markModified('tickets');
        await show.save();
      }
      return res.json({ success: true, message: 'Seats released.' });
    } else {
      const show = store.shows.find((s) => s.showId === showId || s._id === showId);
      if (show && show.tickets) {
        for (const seatId of selectedSeats) {
          const t = show.tickets[seatId];
          if (t && t.status === 'locked' && (!userEmail || t.lockedBy === userEmail)) {
            show.tickets[seatId] = {
              ...t,
              status: 'available',
              lockedBy: null,
              lockedAt: null,
              lockExpiresAt: null,
            };
          }
        }
      }
      return res.json({ success: true, message: 'Seats released.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Confirm booking & finalize payment
// @route   POST /api/bookings/confirm
const confirmBooking = async (req, res) => {
  try {
    const {
      showId,
      selectedSeats,
      paymentMethod = 'Credit Card (Visa)',
      transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide showId and selectedSeats.' });
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'User must be authenticated to complete booking.' });
    }

    const bookingId = `IMV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (getIsConnected()) {
      const show = await Show.findOne({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });

      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const seatDetails = [];
      let subtotal = 0;

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) {
          return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
        }

        if (ticket.status === 'booked') {
          return res.status(400).json({ success: false, message: `Seat ${seatId} has already been reserved.` });
        }

        // If locked by someone else, fail
        if (ticket.status === 'locked' && ticket.lockedBy !== userEmail) {
          return res.status(400).json({ success: false, message: `Seat ${seatId} is locked by another customer.` });
        }

        const price = Number(ticket.price) || 300;
        subtotal += price;
        seatDetails.push({
          seatId,
          tier: ticket.tier || 'Standard',
          price,
        });
      }

      const convenienceFee = Math.round(subtotal * 0.05); // 5% convenience fee
      const taxes = Math.round(subtotal * 0.03); // 3% entertainment tax
      const totalAmount = subtotal + convenienceFee + taxes;

      // Update show seats to booked
      for (const seatId of selectedSeats) {
        const cur = show.tickets[seatId];
        show.tickets[seatId] = {
          ...cur,
          status: 'booked',
          bookedBy: userEmail,
          bookingId,
          lockedBy: null,
          lockExpiresAt: null,
        };
      }
      show.markModified('tickets');
      await show.save();

      let posterUrl = null;
      try {
        const tmdbMovie = await getMovieDetails(show.movieId);
        if (tmdbMovie?.posterUrl) posterUrl = tmdbMovie.posterUrl;
      } catch {}

      const booking = await Booking.create({
        bookingId,
        userEmail,
        showId: show.showId || show._id,
        selectedSeats,
        seatDetails,
        totalAmount,
        convenienceFee,
        taxes,
        paymentStatus: 'Completed',
        paymentMethod,
        transactionId,
        movieName: show.movieName,
        moviePoster: posterUrl,
        theatreName: show.theatreName,
        theatreLocation: show.theatreLocation,
        showDate: show.showDate,
        showTime: show.showTime,
        bookingDate: new Date(),
      });

      // Dispatch digital ticket pass & confirmation email asynchronously via Brevo
      sendBookingConfirmationEmail(userEmail, booking).catch((e) =>
        console.error('Brevo Booking Confirmation Email Error:', e.message)
      );

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully! Enjoy your movie.',
        booking,
      });
    } else {
      // In-Memory store
      const show = store.shows.find((s) => s.showId === showId || s._id === showId);
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const seatDetails = [];
      let subtotal = 0;

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) {
          return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
        }

        if (ticket.status === 'booked') {
          return res.status(400).json({ success: false, message: `Seat ${seatId} has already been reserved.` });
        }

        if (ticket.status === 'locked' && ticket.lockedBy !== userEmail) {
          return res.status(400).json({ success: false, message: `Seat ${seatId} is locked by another customer.` });
        }

        const price = Number(ticket.price) || 300;
        subtotal += price;
        seatDetails.push({
          seatId,
          tier: ticket.tier || 'Standard',
          price,
        });
      }

      const convenienceFee = Math.round(subtotal * 0.05);
      const taxes = Math.round(subtotal * 0.03);
      const totalAmount = subtotal + convenienceFee + taxes;

      for (const seatId of selectedSeats) {
        const cur = show.tickets[seatId];
        show.tickets[seatId] = {
          ...cur,
          status: 'booked',
          bookedBy: userEmail,
          bookingId,
          lockedBy: null,
          lockExpiresAt: null,
        };
      }

      // Find movie poster if available
      const movie = store.movies.find((m) => String(m._id) === String(show.movieId) || m.movieName === show.movieName);
      let posterUrl = movie ? movie.posterUrl : null;
      if (!posterUrl) {
        try {
          const tmdbMovie = await getMovieDetails(show.movieId);
          if (tmdbMovie?.posterUrl) posterUrl = tmdbMovie.posterUrl;
        } catch {}
      }

      const booking = {
        _id: `b_${Date.now()}`,
        bookingId,
        userEmail,
        showId: show.showId || show._id,
        selectedSeats,
        seatDetails,
        totalAmount,
        convenienceFee,
        taxes,
        paymentStatus: 'Completed',
        paymentMethod,
        transactionId,
        movieName: show.movieName,
        moviePoster: posterUrl,
        theatreName: show.theatreName,
        theatreLocation: show.theatreLocation,
        showDate: show.showDate,
        showTime: show.showTime,
        bookingDate: new Date(),
      };

      store.bookings.unshift(booking);

      // Dispatch digital ticket pass & confirmation email asynchronously via Brevo
      sendBookingConfirmationEmail(userEmail, booking).catch((e) =>
        console.error('Brevo Booking Confirmation Email Error:', e.message)
      );

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully! Enjoy your movie.',
        booking,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error confirming booking.' });
  }
};

// @desc    Get bookings for logged-in user
// @route   GET /api/bookings/my-bookings
const getUserBookings = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (getIsConnected()) {
      const bookings = await Booking.find({ userEmail }).sort({ bookingDate: -1 });
      return res.json({ success: true, count: bookings.length, bookings });
    } else {
      const bookings = store.bookings
        .filter((b) => b.userEmail.toLowerCase() === userEmail.toLowerCase())
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      return res.json({ success: true, count: bookings.length, bookings });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:bookingId
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (getIsConnected()) {
      const booking = await Booking.findOne({
        $or: [{ bookingId }, { _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null }],
      });
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      return res.json({ success: true, booking });
    } else {
      const booking = store.bookings.find((b) => b.bookingId === bookingId || b._id === bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      return res.json({ success: true, booking });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/admin/all
const getAllBookings = async (req, res) => {
  try {
    const { search, status } = req.query;

    if (getIsConnected()) {
      const query = {};
      if (status && status !== 'All') {
        query.paymentStatus = status;
      }
      if (search) {
        query.$or = [
          { bookingId: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { movieName: { $regex: search, $options: 'i' } },
          { theatreName: { $regex: search, $options: 'i' } },
        ];
      }

      const bookings = await Booking.find(query).sort({ bookingDate: -1 });

      // Calculate stats
      const totalRevenue = bookings
        .filter((b) => b.paymentStatus === 'Completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      return res.json({
        success: true,
        count: bookings.length,
        totalRevenue,
        bookings,
      });
    } else {
      let filtered = [...store.bookings];

      if (status && status !== 'All') {
        filtered = filtered.filter((b) => b.paymentStatus === status);
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.bookingId.toLowerCase().includes(q) ||
            b.userEmail.toLowerCase().includes(q) ||
            (b.movieName && b.movieName.toLowerCase().includes(q)) ||
            (b.theatreName && b.theatreName.toLowerCase().includes(q))
        );
      }

      filtered.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

      const totalRevenue = filtered
        .filter((b) => b.paymentStatus === 'Completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      return res.json({
        success: true,
        count: filtered.length,
        totalRevenue,
        bookings: filtered,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Cancel booking (Admin / User) and release seats
// @route   PUT /api/bookings/cancel/:bookingId
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (getIsConnected()) {
      const booking = await Booking.findOne({
        $or: [{ bookingId }, { _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null }],
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      booking.paymentStatus = 'Cancelled';
      await booking.save();

      // Release seats in show
      const show = await Show.findOne({
        $or: [{ showId: booking.showId }, { _id: booking.showId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null }],
      });

      if (show && show.tickets) {
        for (const seatId of booking.selectedSeats) {
          if (show.tickets[seatId]) {
            show.tickets[seatId] = {
              ...show.tickets[seatId],
              status: 'available',
              bookedBy: null,
              bookingId: null,
            };
          }
        }
        show.markModified('tickets');
        await show.save();
      }

      // Dispatch booking cancellation update email asynchronously
      sendBookingStatusUpdateEmail(booking.userEmail, {
        bookingId: booking.bookingId,
        movieName: booking.movieName,
        status: 'Cancelled',
        showDate: booking.showDate,
        showTime: booking.showTime,
        refundAmount: booking.totalAmount,
      }).catch((e) => console.error('Brevo Cancellation Email Error:', e.message));

      return res.json({ success: true, message: 'Booking cancelled and seats released.', booking });
    } else {
      const booking = store.bookings.find((b) => b.bookingId === bookingId || b._id === bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      booking.paymentStatus = 'Cancelled';

      // Release seats
      const show = store.shows.find((s) => s.showId === booking.showId || s._id === booking.showId);
      if (show && show.tickets) {
        for (const seatId of booking.selectedSeats) {
          if (show.tickets[seatId]) {
            show.tickets[seatId] = {
              ...show.tickets[seatId],
              status: 'available',
              bookedBy: null,
              bookingId: null,
            };
          }
        }
      }

      // Dispatch booking cancellation update email asynchronously
      sendBookingStatusUpdateEmail(booking.userEmail, {
        bookingId: booking.bookingId,
        movieName: booking.movieName,
        status: 'Cancelled',
        showDate: booking.showDate,
        showTime: booking.showTime,
        refundAmount: booking.totalAmount,
      }).catch((e) => console.error('Brevo Cancellation Email Error:', e.message));

      return res.json({ success: true, message: 'Booking cancelled and seats released.', booking });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
  lockSeats,
  unlockSeats,
  confirmBooking,
  getUserBookings,
  getBookingById,
  getAllBookings,
  cancelBooking,
};
