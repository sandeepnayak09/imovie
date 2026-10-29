const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getIsConnected } = require('../config/db');
const { store, cleanupExpiredSeatLocks } = require('../data/store');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const { getMovieDetails } = require('../services/tmdbService');
const { sendBookingConfirmationEmail } = require('../services/emailService');

// Initialize Razorpay instance with environment credentials
const getRazorpayInstance = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || 'rzp_test_TpQ7mg5jyDRTt0').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS').trim();

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
const createOrder = async (req, res) => {
  try {
    const { amount, showId, selectedSeats } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and selected seats are required.' });
    }

    const key_id = (process.env.RAZORPAY_KEY_ID || 'rzp_test_TpQ7mg5jyDRTt0').trim();
    const razorpay = getRazorpayInstance();

    // Convert amount in INR to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Payment amount must be at least ₹1.00.' });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString(36)}_${Math.floor(100 + Math.random() * 900)}`,
      payment_capture: 1, // Auto-capture payment on successful authorization
      notes: {
        showId: String(showId),
        userEmail: String(userEmail || 'customer@imovies.com'),
        seats: selectedSeats.join(','),
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to initialize payment gateway order.',
    });
  }
};

// @desc    Verify Razorpay Payment Signature and Finalize Reservation
// @route   POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory Razorpay transaction attributes for verification.',
      });
    }

    const secret = (process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS').trim();

    // 1. Verify HMAC SHA256 Signature using timingSafeEqual
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf-8');
    const isAuthentic = expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

    const {
      showId,
      selectedSeats = [],
      totalAmount,
      convenienceFee = 0,
      taxes = 0,
    } = bookingDetails || {};

    let paymentMethod = bookingDetails?.paymentMethod || 'Razorpay Gateway';
    const userEmail = req.user?.email || bookingDetails?.userEmail || req.body.userEmail;

    // Handle signature mismatch
    if (!isAuthentic) {
      console.warn('❌ Razorpay signature verification failed!');

      // Unlock held seats since transaction failed verification
      if (showId && selectedSeats.length > 0) {
        if (getIsConnected()) {
          const show = await Show.findOne({
            $or: [{ showId: String(showId) }, { _id: String(showId) }],
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
        } else {
          const show = store.shows.find((s) => s.showId === String(showId) || s._id === String(showId));
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
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Transaction verification failed.',
      });
    }

    // 2. Fetch payment details from Razorpay to enrich payment instrument metadata
    try {
      const razorpay = getRazorpayInstance();
      const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);
      if (paymentInfo) {
        if (paymentInfo.method === 'upi') {
          paymentMethod = `Razorpay UPI (${paymentInfo.vpa || 'Instant'})`;
        } else if (paymentInfo.method === 'card') {
          const net = paymentInfo.card?.network || 'Card';
          const last4 = paymentInfo.card?.last4 ? `•••• ${paymentInfo.card.last4}` : '';
          paymentMethod = `Razorpay Card (${net} ${last4})`.trim();
        } else if (paymentInfo.method === 'netbanking') {
          paymentMethod = `Razorpay Netbanking (${paymentInfo.bank || 'Bank'})`;
        } else if (paymentInfo.method === 'wallet') {
          paymentMethod = `Razorpay Wallet (${paymentInfo.wallet || 'Wallet'})`;
        }
      }
    } catch (fetchErr) {
      console.warn('Optional: could not fetch payment details from Razorpay API:', fetchErr.message);
    }

    // 3. Payment Signature is Valid -> Confirm Booking & Finalize Seats
    const bookingId = `IMV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (getIsConnected()) {
      const show = await Show.findOne({
        $or: [{ showId: String(showId) }, { _id: String(showId) }],
      });

      if (!show) {
        return res.status(404).json({ success: false, message: 'Associated show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const seatDetails = [];
      let subtotal = 0;

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) continue;

        const price = Number(ticket.price) || 350;
        subtotal += price;
        seatDetails.push({
          seatId,
          tier: ticket.tier || 'Middle',
          price,
        });

        // Mark as booked
        show.tickets[seatId] = {
          ...ticket,
          status: 'booked',
          bookedBy: userEmail,
          bookingId,
          lockedBy: null,
          lockExpiresAt: null,
        };
      }

      show.markModified('tickets');
      await show.save();

      // Resolve poster url
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
        totalAmount: Number(totalAmount) || subtotal + convenienceFee + taxes,
        convenienceFee,
        taxes,
        paymentStatus: 'Completed',
        paymentMethod,
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        movieName: show.movieName,
        moviePoster: posterUrl,
        theatreName: show.theatreName,
        theatreLocation: show.theatreLocation,
        showDate: show.showDate,
        showTime: show.showTime,
        bookingDate: new Date(),
      });

      // Dispatch Brevo digital ticket pass & confirmation email asynchronously
      sendBookingConfirmationEmail(booking.userEmail, booking).catch((e) =>
        console.error('Brevo Payment Confirmation Email Error:', e.message)
      );

      return res.status(200).json({
        success: true,
        message: 'Payment verified and ticket reservation confirmed successfully!',
        booking,
      });
    } else {
      // In-Memory store fallback
      const show = store.shows.find((s) => s.showId === String(showId) || s._id === String(showId));
      if (!show) {
        return res.status(404).json({ success: false, message: 'Associated show not found.' });
      }

      cleanupExpiredSeatLocks(show);

      const seatDetails = [];
      let subtotal = 0;

      for (const seatId of selectedSeats) {
        const ticket = show.tickets ? show.tickets[seatId] : null;
        if (!ticket) continue;

        const price = Number(ticket.price) || 350;
        subtotal += price;
        seatDetails.push({
          seatId,
          tier: ticket.tier || 'Middle',
          price,
        });

        show.tickets[seatId] = {
          ...ticket,
          status: 'booked',
          bookedBy: userEmail,
          bookingId,
          lockedBy: null,
          lockExpiresAt: null,
        };
      }

      // Poster lookup
      let posterUrl = null;
      try {
        const tmdbMovie = await getMovieDetails(show.movieId);
        if (tmdbMovie?.posterUrl) posterUrl = tmdbMovie.posterUrl;
      } catch {}

      const booking = {
        _id: `b_${Date.now()}`,
        bookingId,
        userEmail,
        showId: show.showId || show._id,
        selectedSeats,
        seatDetails,
        totalAmount: Number(totalAmount) || subtotal + convenienceFee + taxes,
        convenienceFee,
        taxes,
        paymentStatus: 'Completed',
        paymentMethod,
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        movieName: show.movieName,
        moviePoster: posterUrl,
        theatreName: show.theatreName,
        theatreLocation: show.theatreLocation,
        showDate: show.showDate,
        showTime: show.showTime,
        bookingDate: new Date(),
      };

      store.bookings.unshift(booking);

      // Dispatch Brevo digital ticket pass & confirmation email asynchronously
      sendBookingConfirmationEmail(booking.userEmail, booking).catch((e) =>
        console.error('Brevo Payment Confirmation Email Error:', e.message)
      );

      return res.status(200).json({
        success: true,
        message: 'Payment verified and ticket reservation confirmed successfully!',
        booking,
      });
    }
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
};

// @desc    Handle Payment Failure or Cancelation Notification
// @route   POST /api/payment/cancel-or-fail
const cancelOrFailPayment = async (req, res) => {
  try {
    const { showId, selectedSeats, errorDetails } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    console.warn('⚠️ Payment cancelled/failed notification received:', {
      showId,
      seats: selectedSeats,
      userEmail,
      errorDetails,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment failure logged. Seats remain held until TTL expires or released.',
    });
  } catch (error) {
    console.error('Payment cancel logging error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  cancelOrFailPayment,
};
