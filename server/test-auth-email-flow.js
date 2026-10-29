require('dotenv').config({ path: __dirname + '/.env' });
const { initStore, store } = require('./data/store');
const {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require('./services/emailService');

const runFullTest = async () => {
  console.log('🚀 Starting iMovies Brevo Transactional Email & Auth Flow Test...\n');

  await initStore();

  const testEmail = 'en24cs3010918@medicaps.ac.in'; // Verified sender & test receiver
  const testUsername = 'PrimeTester';

  // Test 1: Account Verification OTP + Link
  console.log('--- Test 1: Sending Account Verification Email (OTP + Direct Link) ---');
  const regOtp = '849201';
  const regToken = 'tok_test_' + Date.now();
  const regResult = await sendVerificationEmail(testEmail, {
    verificationToken: regToken,
    otp: regOtp,
    username: testUsername,
  });

  console.log('Verification Email Result:', regResult);
  if (!regResult.success) {
    throw new Error('Test 1 Failed: ' + regResult.error);
  }
  console.log('✅ Test 1 Passed! Message ID:', regResult.messageId);

  // Test 2: Password Reset Recovery OTP + Link
  console.log('\n--- Test 2: Sending Password Recovery Email (OTP + Direct Reset Link) ---');
  const resetOtp = '629104';
  const resetToken = 'rst_tok_' + Date.now();
  const resetResult = await sendPasswordResetEmail(testEmail, {
    resetToken,
    otp: resetOtp,
    username: testUsername,
  });

  console.log('Password Reset Email Result:', resetResult);
  if (!resetResult.success) {
    throw new Error('Test 2 Failed: ' + resetResult.error);
  }
  console.log('✅ Test 2 Passed! Message ID:', resetResult.messageId);

  // Test 3: Booking Confirmation & Digital Ticket Pass
  console.log('\n--- Test 3: Sending Digital Ticket Confirmation Email ---');
  const sampleBooking = {
    bookingId: 'IMV-2026-77392',
    movieName: 'Dune: Part Two',
    theatreName: 'PVR Director\'s Cut, Ambience Mall',
    theatreLocation: 'Vasant Kunj, New Delhi',
    showDate: new Date(),
    showTime: '08:15 PM',
    selectedSeats: ['B-14', 'B-15'],
    seatDetails: [
      { seatId: 'B-14', tier: 'Balcony', price: 450 },
      { seatId: 'B-15', tier: 'Balcony', price: 450 },
    ],
    totalAmount: 972,
    convenienceFee: 45,
    taxes: 27,
    paymentMethod: 'Razorpay UPI (Test Mode)',
    transactionId: 'pay_rzp_99482910',
  };

  const bookingResult = await sendBookingConfirmationEmail(testEmail, sampleBooking);
  console.log('Booking Email Result:', bookingResult);
  if (!bookingResult.success) {
    throw new Error('Test 3 Failed: ' + bookingResult.error);
  }
  console.log('✅ Test 3 Passed! Message ID:', bookingResult.messageId);

  // Test 4: Booking Status Update (Cancellation Notice)
  console.log('\n--- Test 4: Sending Booking Status Cancellation Email ---');
  const statusResult = await sendBookingStatusUpdateEmail(testEmail, {
    bookingId: sampleBooking.bookingId,
    movieName: sampleBooking.movieName,
    status: 'Cancelled',
    showDate: sampleBooking.showDate,
    showTime: sampleBooking.showTime,
    refundAmount: 972,
  });

  console.log('Cancellation Email Result:', statusResult);
  if (!statusResult.success) {
    throw new Error('Test 4 Failed: ' + statusResult.error);
  }
  console.log('✅ Test 4 Passed! Message ID:', statusResult.messageId);

  console.log('\n======================================================');
  console.log('🎉 ALL BREVO TRANSACTIONAL EMAIL INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
};

runFullTest().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
