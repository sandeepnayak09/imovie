const {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require('../services/emailService');

// @desc    Trigger a test transactional email
// @route   POST /api/email/test
const sendTestEmail = async (req, res) => {
  try {
    const { type = 'custom', email, ...payload } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    let result;

    switch (type) {
      case 'verification':
        result = await sendVerificationEmail(email, {
          otp: payload.otp || '784912',
          verificationToken: payload.verificationToken || 'test_token_sample_123',
          username: payload.username || 'MovieFan',
        });
        break;

      case 'password_reset':
        result = await sendPasswordResetEmail(email, {
          otp: payload.otp || '492816',
          resetToken: payload.resetToken || 'reset_token_sample_456',
          username: payload.username || 'MovieFan',
        });
        break;

      case 'booking_confirmation':
        result = await sendBookingConfirmationEmail(email, {
          bookingId: payload.bookingId || 'IMV-2026-98765',
          movieName: payload.movieName || 'Avatar: The Way of Water',
          theatreName: payload.theatreName || 'PVR Director\'s Cut, Ambience Mall',
          theatreLocation: payload.theatreLocation || 'Vasant Kunj, New Delhi',
          showDate: payload.showDate || new Date(),
          showTime: payload.showTime || '07:30 PM',
          selectedSeats: payload.selectedSeats || ['B-12', 'B-14'],
          seatDetails: payload.seatDetails || [
            { seatId: 'B-12', tier: 'Balcony', price: 450 },
            { seatId: 'B-14', tier: 'Balcony', price: 450 },
          ],
          totalAmount: payload.totalAmount || 972,
          convenienceFee: 45,
          taxes: 27,
          paymentMethod: 'UPI / NetBanking',
          transactionId: 'TXN-8849204',
        });
        break;

      case 'booking_status':
        result = await sendBookingStatusUpdateEmail(email, {
          bookingId: payload.bookingId || 'IMV-2026-98765',
          movieName: payload.movieName || 'Avatar: The Way of Water',
          status: payload.status || 'Cancelled',
          showDate: payload.showDate || new Date(),
          showTime: payload.showTime || '07:30 PM',
          refundAmount: payload.refundAmount || 972,
        });
        break;

      default:
        result = await sendEmail({
          to: email,
          subject: payload.subject || '🎬 iMovies Transactional Notification',
          htmlContent:
            payload.htmlContent ||
            '<div style="background:#0f171e;color:#fff;padding:20px;font-family:sans-serif;"><h2>iMovies Test Notification</h2><p>This is a test notification from the iMovies Brevo transactional service engine.</p></div>',
          textContent: payload.textContent || 'iMovies Transactional Service Test Message',
        });
        break;
    }

    if (result && result.success) {
      return res.status(200).json({
        success: true,
        message: `Transactional email (${type}) successfully dispatched to ${email}`,
        messageId: result.messageId,
      });
    } else {
      return res.status(502).json({
        success: false,
        message: 'Brevo transactional engine failed to send email.',
        error: result?.error || 'Unknown dispatch failure',
      });
    }
  } catch (error) {
    console.error('Email Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing email request.',
    });
  }
};

// @desc    Dispatch digital ticket pass on demand
// @route   POST /api/email/send-ticket
const sendTicketPassEmail = async (req, res) => {
  try {
    const { email, booking } = req.body;
    if (!email || !booking) {
      return res.status(400).json({ success: false, message: 'Email and booking details are required.' });
    }

    const result = await sendBookingConfirmationEmail(email, booking);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Digital ticket pass successfully sent to ${email}`,
        messageId: result.messageId,
      });
    } else {
      return res.status(502).json({
        success: false,
        message: 'Failed to deliver digital ticket pass via Brevo.',
        error: result.error,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendTestEmail,
  sendTicketPassEmail,
};
