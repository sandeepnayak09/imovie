const nodemailer = require('nodemailer');
const { BrevoClient } = require('@getbrevo/brevo');
const emailConfig = require('../config/emailConfig');

// Initialize Brevo Transactional Email Client
let brevoClient = null;

const getBrevoClient = () => {
  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey: emailConfig.apiKey });
  }
  return brevoClient;
};

// Initialize optional direct Gmail SMTP Transporter
let nodemailerTransporter = null;
const getNodemailerTransporter = () => {
  if (!nodemailerTransporter && emailConfig.gmailUser && emailConfig.gmailAppPassword) {
    nodemailerTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.gmailUser,
        pass: emailConfig.gmailAppPassword,
      },
    });
  }
  return nodemailerTransporter;
};

/**
 * Base method to send a transactional email
 */
const sendEmail = async ({ to, subject, htmlContent, textContent, replyTo, tags }) => {
  const recipients = Array.isArray(to)
    ? to.map((recipient) => (typeof recipient === 'string' ? { email: recipient } : recipient))
    : [typeof to === 'string' ? { email: to } : to];

  const recipientEmails = recipients.map((r) => r.email).join(', ');

  // 1. Try Direct Gmail SMTP if configured
  const gmailTransporter = getNodemailerTransporter();
  if (gmailTransporter) {
    try {
      const info = await gmailTransporter.sendMail({
        from: `"${emailConfig.senderName}" <${emailConfig.gmailUser}>`,
        to: recipientEmails,
        subject,
        html: htmlContent,
        text: textContent || subject,
        replyTo: replyTo || emailConfig.gmailUser,
      });
      console.log(`✉️ Direct Gmail SMTP email dispatched to ${recipientEmails} | ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'gmail-smtp' };
    } catch (gmailErr) {
      console.warn('⚠️ Direct Gmail SMTP failed, falling back to Brevo:', gmailErr.message);
    }
  }

  // 2. Send via Brevo Transactional Email API
  try {
    const client = getBrevoClient();

    const payload = {
      sender: {
        email: emailConfig.senderEmail,
        name: emailConfig.senderName,
      },
      to: recipients,
      subject,
      htmlContent,
      textContent: textContent || subject,
    };

    if (replyTo) {
      payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
    }

    if (tags && Array.isArray(tags)) {
      payload.tags = tags;
    }

    const response = await client.transactionalEmails.sendTransacEmail(payload);
    console.log(`✉️ Brevo email dispatched to ${recipientEmails} | ID: ${response?.messageId || 'Success'}`);
    return { success: true, messageId: response?.messageId, response, provider: 'brevo' };
  } catch (error) {
    const errMsg =
      error.body?.message ||
      error.response?.data?.message ||
      error.message ||
      'Email delivery failure';

    console.error('❌ Email Dispatch Failed:', {
      status: error.status || error.statusCode,
      message: errMsg,
      body: error.body || error.response?.data,
    });
    return { success: false, error: errMsg };
  }
};

/**
 * Base method to send an email using a registered Brevo Template ID
 */
const sendTemplateEmail = async ({ to, templateId, params }) => {
  try {
    const client = getBrevoClient();

    const recipients = Array.isArray(to)
      ? to.map((recipient) => (typeof recipient === 'string' ? { email: recipient } : recipient))
      : [typeof to === 'string' ? { email: to } : to];

    const payload = {
      to: recipients,
      templateId: Number(templateId),
      params: params || {},
    };

    const response = await client.transactionalEmails.sendTransacEmail(payload);
    return { success: true, messageId: response?.messageId };
  } catch (error) {
    console.error('❌ Brevo Template Email Failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Account Verification Email Wrapper (OTP + Clickable Link)
 */
const sendVerificationEmail = async (email, { verificationToken, verificationLink, otp, username }) => {
  const directLink = verificationLink || `${emailConfig.clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  const displayUsername = username || email.split('@')[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 30px auto; background-color: #1a242f; border-radius: 16px; border: 1px solid #2a3b4c; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f171e 0%, #1a242f 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #2a3b4c; }
        .brand { font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; }
        .brand-dot { color: #00a8e1; }
        .badge { display: inline-block; background-color: rgba(0, 168, 225, 0.15); border: 1px solid rgba(0, 168, 225, 0.4); color: #00a8e1; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; margin-top: 6px; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #8197a4; margin-bottom: 28px; }
        .otp-box { background-color: #0f171e; border: 2px dashed #00a8e1; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 28px; }
        .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #8197a4; letter-spacing: 2px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 900; color: #00a8e1; letter-spacing: 10px; font-family: monospace; }
        .button { display: block; width: 100%; box-sizing: border-box; background-color: #00a8e1; color: #ffffff !important; text-align: center; padding: 15px 24px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; margin-bottom: 20px; }
        .expiry-note { font-size: 12px; color: #8197a4; text-align: center; margin-top: 16px; }
        .footer { background-color: #0f171e; padding: 24px; text-align: center; font-size: 11px; color: #8197a4; border-top: 1px solid #2a3b4c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">i<span class="brand-dot">Movies</span> Prime</div>
          <div class="badge">Security Verification</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${displayUsername}!</div>
          <div class="desc">
            To complete your registration for <strong>iMovies Prime</strong>, please enter the One-Time Password (OTP) on the verification window or click the button below:
          </div>

          <div class="otp-box">
            <div class="otp-label">Your One-Time Passcode (OTP)</div>
            <div class="otp-code">${otp}</div>
          </div>

          <a href="${directLink}" class="button" target="_blank">Verify Email Address Automatically</a>

          <div class="expiry-note">
            ⏳ This security code and link will expire in <strong>10 minutes</strong>. If you did not create an iMovies account, please ignore this email.
          </div>
        </div>
        <div class="footer">
          © 2026 iMovies Entertainment Inc. • All Rights Reserved<br>
          Sent via Brevo Transactional Email Engine
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎬 Your iMovies Verification Code is ${otp}`,
    htmlContent,
    tags: ['account-verification', 'registration-otp'],
  });
};

/**
 * 2. Password Recovery Email Wrapper (OTP + Reset Link)
 */
const sendPasswordResetEmail = async (email, { resetToken, resetLink, otp, username }) => {
  const directLink = resetLink || `${emailConfig.clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  const displayUsername = username || email.split('@')[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 30px auto; background-color: #1a242f; border-radius: 16px; border: 1px solid #2a3b4c; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f171e 0%, #1a242f 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #2a3b4c; }
        .brand { font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; }
        .brand-dot { color: #00a8e1; }
        .badge { display: inline-block; background-color: rgba(229, 9, 20, 0.15); border: 1px solid rgba(229, 9, 20, 0.4); color: #E50914; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; margin-top: 6px; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #8197a4; margin-bottom: 28px; }
        .otp-box { background-color: #0f171e; border: 2px dashed #E50914; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 28px; }
        .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #8197a4; letter-spacing: 2px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 900; color: #E50914; letter-spacing: 10px; font-family: monospace; }
        .button { display: block; width: 100%; box-sizing: border-box; background-color: #E50914; color: #ffffff !important; text-align: center; padding: 15px 24px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; margin-bottom: 20px; }
        .security-alert { background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 14px; font-size: 12px; color: #d1d5db; border-radius: 4px; margin-top: 20px; }
        .footer { background-color: #0f171e; padding: 24px; text-align: center; font-size: 11px; color: #8197a4; border-top: 1px solid #2a3b4c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">i<span class="brand-dot">Movies</span> Prime</div>
          <div class="badge">Password Reset</div>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${displayUsername}</div>
          <div class="desc">
            We received a request to reset your password for your <strong>iMovies Prime</strong> account. Enter the 6-digit recovery code below on the reset page or click the direct reset button:
          </div>

          <div class="otp-box">
            <div class="otp-label">Password Recovery Code</div>
            <div class="otp-code">${otp}</div>
          </div>

          <a href="${directLink}" class="button" target="_blank">Reset Password Now</a>

          <div class="security-alert">
            🛡️ <strong>Security Notice:</strong> This code is valid for <strong>15 minutes</strong>. If you did not make this request, please contact iMovies Support immediately; your password remains unchanged.
          </div>
        </div>
        <div class="footer">
          © 2026 iMovies Entertainment Inc. • All Rights Reserved<br>
          Sent via Brevo Transactional Email Engine
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🔒 iMovies Password Recovery Code: ${otp}`,
    htmlContent,
    tags: ['password-reset', 'recovery-code'],
  });
};

/**
 * 3. Booking Confirmation & Digital Ticket Email Wrapper
 */
const sendBookingConfirmationEmail = async (email, booking) => {
  const {
    bookingId,
    movieName,
    moviePoster,
    theatreName,
    theatreLocation,
    showDate,
    showTime,
    selectedSeats = [],
    seatDetails = [],
    totalAmount,
    paymentMethod,
    transactionId,
  } = booking;

  const formattedDate = showDate
    ? new Date(showDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Today';

  const seatsList = selectedSeats.join(', ');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 30px auto; background-color: #1a242f; border-radius: 16px; border: 1px solid #2a3b4c; overflow: hidden; }
        .header { background: linear-gradient(135deg, #00a8e1 0%, #0077b6 100%); padding: 24px; text-align: center; color: #ffffff; }
        .header-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
        .booking-badge { display: inline-block; background-color: rgba(0, 0, 0, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-top: 8px; font-family: monospace; letter-spacing: 1px; }
        .content { padding: 32px 28px; }
        .ticket-card { background-color: #0f171e; border-radius: 14px; border: 1px solid #2a3b4c; padding: 24px; margin-bottom: 24px; }
        .movie-title { font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 4px; }
        .theatre-name { font-size: 14px; color: #00a8e1; font-weight: 700; margin-bottom: 4px; }
        .theatre-location { font-size: 12px; color: #8197a4; margin-bottom: 16px; }
        .details-grid { display: table; width: 100%; border-top: 1px solid #2a3b4c; padding-top: 16px; }
        .details-row { display: table-row; }
        .details-cell { display: table-cell; padding: 6px 0; font-size: 13px; color: #8197a4; }
        .details-value { display: table-cell; padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; }
        .seats-pill { display: inline-block; background-color: #00a8e1; color: #ffffff; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 13px; letter-spacing: 1px; }
        .total-row { border-top: 2px dashed #2a3b4c; margin-top: 14px; padding-top: 14px; }
        .total-amount { font-size: 22px; font-weight: 900; color: #00a8e1; }
        .instructions { background-color: rgba(0, 168, 225, 0.08); border: 1px solid rgba(0, 168, 225, 0.25); border-radius: 10px; padding: 16px; font-size: 12px; color: #d1d5db; line-height: 1.5; margin-bottom: 24px; }
        .footer { background-color: #0f171e; padding: 20px; text-align: center; font-size: 11px; color: #8197a4; border-top: 1px solid #2a3b4c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-title">🎟️ Digital Boarding Pass Confirmed</div>
          <div class="booking-badge">PASS ID: ${bookingId}</div>
        </div>

        <div class="content">
          <div class="ticket-card">
            <div class="movie-title">${movieName}</div>
            <div class="theatre-name">${theatreName}</div>
            <div class="theatre-location">${theatreLocation || 'Prime Multiplex Center'}</div>

            <div class="details-grid">
              <div class="details-row">
                <div class="details-cell">Show Date:</div>
                <div class="details-value">${formattedDate}</div>
              </div>
              <div class="details-row">
                <div class="details-cell">Showtime:</div>
                <div class="details-value">${showTime}</div>
              </div>
              <div class="details-row">
                <div class="details-cell">Seats Reserved (${selectedSeats.length}):</div>
                <div class="details-value"><span class="seats-pill">${seatsList}</span></div>
              </div>
              <div class="details-row">
                <div class="details-cell">Payment Method:</div>
                <div class="details-value">${paymentMethod || 'Razorpay / Card'}</div>
              </div>
              <div class="details-row">
                <div class="details-cell">Transaction Ref:</div>
                <div class="details-value" style="font-family: monospace; font-size: 11px;">${transactionId || 'TXN-CONFIRMED'}</div>
              </div>
            </div>

            <div class="details-grid total-row">
              <div class="details-row">
                <div class="details-cell" style="font-size: 16px; font-weight: 800; color: #ffffff;">Total Paid:</div>
                <div class="details-value total-amount">₹${totalAmount}</div>
              </div>
            </div>
          </div>

          <div class="instructions">
            📌 <strong>Turnstile Instructions:</strong> Please present this digital ticket receipt at the auditorium entrance. You can also view and print your QR boarding pass anytime under <strong>My Bookings</strong> on iMovies.
          </div>
        </div>

        <div class="footer">
          © 2026 iMovies Entertainment Inc. • All Rights Reserved<br>
          Sent via Brevo Transactional Email Engine
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎟️ Ticket Confirmed: ${movieName} (ID: ${bookingId})`,
    htmlContent,
    tags: ['ticket-confirmation', 'booking-receipt'],
  });
};

/**
 * 4. Booking Status Update Email Wrapper (Cancellation / Status Change)
 */
const sendBookingStatusUpdateEmail = async (email, statusDetails) => {
  const {
    bookingId,
    movieName,
    theatreName,
    status = 'Cancelled',
    reason = 'Reservation cancelled upon customer request. Selected seats have been released.',
    refundAmount,
  } = statusDetails;

  const isCancelled = status.toLowerCase() === 'cancelled';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 30px auto; background-color: #1a242f; border-radius: 16px; border: 1px solid #2a3b4c; overflow: hidden; }
        .header { background: ${isCancelled ? '#7f1d1d' : '#0f171e'}; padding: 24px; text-align: center; color: #ffffff; border-bottom: 1px solid #2a3b4c; }
        .status-badge { display: inline-block; background-color: ${isCancelled ? '#ef4444' : '#00a8e1'}; color: #ffffff; font-size: 12px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
        .content { padding: 32px 28px; }
        .card { background-color: #0f171e; border-radius: 12px; border: 1px solid #2a3b4c; padding: 20px; margin-bottom: 20px; }
        .footer { background-color: #0f171e; padding: 20px; text-align: center; font-size: 11px; color: #8197a4; border-top: 1px solid #2a3b4c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 22px; font-weight: 900;">iMovies Booking Status Notification</div>
          <div class="status-badge">${status}</div>
        </div>

        <div class="content">
          <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
            Your ticket reservation <strong>#${bookingId}</strong> for <strong>${movieName || 'Movie'}</strong> has been updated.
          </p>

          <div class="card">
            <p style="margin: 0 0 8px; font-size: 13px; color: #8197a4;">Status Details:</p>
            <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: 600;">${reason}</p>
            ${
              refundAmount
                ? `<p style="margin: 12px 0 0; font-size: 13px; color: #00c853;"><strong>Refund Amount:</strong> ₹${refundAmount} (processed to original payment method)</p>`
                : ''
            }
          </div>

          <p style="font-size: 12px; color: #8197a4;">
            If you have questions regarding this change, please reach out to our 24/7 concierge support.
          </p>
        </div>

        <div class="footer">
          © 2026 iMovies Entertainment Inc. • All Rights Reserved<br>
          Sent via Brevo Transactional Email Engine
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `📢 Booking Update: ${movieName || 'Ticket'} #${bookingId} is ${status}`,
    htmlContent,
    tags: ['booking-status', 'booking-cancellation'],
  });
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
};
