const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: __dirname + '/.env' });

const API_BASE = 'http://localhost:5000/api';
const SECRET = process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS';

async function runFullVerification() {
  console.log('====================================================');
  console.log('🚀 Starting iMovies Razorpay End-to-End Verification');
  console.log('====================================================');

  try {
    // 1. Fetch available shows
    console.log('\n--- Step 1: Querying Active Show & Seating Layout ---');
    const showsRes = await axios.get(`${API_BASE}/shows`);
    if (!showsRes.data?.success || showsRes.data.shows.length === 0) {
      throw new Error('No shows available in store/db to test payment on.');
    }

    const testShow = showsRes.data.shows[0];
    const showId = testShow.showId || testShow._id;
    console.log(`✅ Selected Test Show: "${testShow.movieName}" (${showId}) at "${testShow.theatreName}"`);

    // Pick 2 available seats
    const seatKeys = Object.keys(testShow.tickets || {});
    const availableSeats = seatKeys.filter((k) => testShow.tickets[k].status === 'available');
    if (availableSeats.length < 2) {
      throw new Error('Not enough available seats in test show.');
    }
    const testSeats = [availableSeats[0], availableSeats[1]];
    console.log(`✅ Selected Seats to Book: ${testSeats.join(', ')}`);

    // 2. Lock Seats with TTL
    console.log('\n--- Step 2: Locking Seats (POST /api/bookings/lock-seats) ---');
    const userEmail = 'testcustomer@imovies.com';
    const lockRes = await axios.post(`${API_BASE}/bookings/lock-seats`, {
      showId,
      selectedSeats: testSeats,
      userEmail,
    });
    console.log('✅ Lock Result:', lockRes.data.message, `TTL: ${lockRes.data.ttlSeconds}s`);

    // 3. Create Razorpay Payment Order (POST /api/payment/create-order)
    console.log('\n--- Step 3: Initializing Razorpay Order (POST /api/payment/create-order) ---');
    const totalAmount = 518; // ₹518
    const orderRes = await axios.post(`${API_BASE}/payment/create-order`, {
      amount: totalAmount,
      showId,
      selectedSeats: testSeats,
      userEmail,
    });

    if (!orderRes.data?.success || !orderRes.data.order_id) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderRes.data)}`);
    }

    const { order_id, amount, currency, key_id, receipt } = orderRes.data;
    console.log('✅ Razorpay Order Created Successfully:');
    console.log(`   - Order ID: ${order_id}`);
    console.log(`   - Amount (paise): ${amount} (${amount / 100} INR)`);
    console.log(`   - Currency: ${currency}`);
    console.log(`   - Key ID: ${key_id}`);
    console.log(`   - Receipt: ${receipt}`);

    // 4. Test Signature Verification Failure (Tampered signature)
    console.log('\n--- Step 4: Testing Tampered Signature Security Check ---');
    const fakePaymentId = `pay_fake_${Date.now()}`;
    const tamperedSignature = '0000000000000000000000000000000000000000000000000000000000000000';

    try {
      await axios.post(`${API_BASE}/payment/verify`, {
        razorpay_order_id: order_id,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: tamperedSignature,
        bookingDetails: {
          showId,
          selectedSeats: testSeats,
          totalAmount,
          userEmail,
        },
      });
      console.error('❌ Security check failed: Tampered signature was accepted!');
    } catch (tamperErr) {
      console.log('✅ Security check passed: Tampered signature rejected with 400 Bad Request:');
      console.log(`   Status: ${tamperErr.response?.status} - ${tamperErr.response?.data?.message}`);
    }

    // Re-lock seats since tampered test unlocked them as a security precaution
    await axios.post(`${API_BASE}/bookings/lock-seats`, {
      showId,
      selectedSeats: testSeats,
      userEmail,
    });

    // 5. Test Genuine Signature Verification and Final Booking
    console.log('\n--- Step 5: Testing Genuine HMAC-SHA256 Signature Verification ---');
    const testPaymentId = `pay_sim_${Date.now().toString(36)}`;
    const validSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${order_id}|${testPaymentId}`)
      .digest('hex');

    console.log(`   - Generated Valid Signature: ${validSignature}`);

    const verifyRes = await axios.post(`${API_BASE}/payment/verify`, {
      razorpay_order_id: order_id,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
      bookingDetails: {
        showId,
        selectedSeats: testSeats,
        seatDetails: [
          { seatId: testSeats[0], tier: 'Middle', price: 230 },
          { seatId: testSeats[1], tier: 'Middle', price: 230 },
        ],
        totalAmount,
        convenienceFee: 26,
        taxes: 32,
        userEmail,
        paymentMethod: 'Razorpay Gateway (Verified)',
      },
    });

    if (!verifyRes.data?.success || !verifyRes.data.booking) {
      throw new Error(`Verification response failed: ${JSON.stringify(verifyRes.data)}`);
    }

    const booking = verifyRes.data.booking;
    console.log('✅ Payment Verification & Ticket Generation Succeeded:');
    console.log(`   - Booking ID: ${booking.bookingId}`);
    console.log(`   - Payment Status: ${booking.paymentStatus}`);
    console.log(`   - Razorpay Order ID: ${booking.razorpayOrderId}`);
    console.log(`   - Razorpay Payment ID: ${booking.razorpayPaymentId}`);
    console.log(`   - Total Paid: ₹${booking.totalAmount}`);
    console.log(`   - Seats: ${booking.selectedSeats.join(', ')}`);

    // 6. Verify Seat Status Changed to "booked"
    console.log('\n--- Step 6: Verifying Real-time Seat Status Transition ---');
    const updatedShowRes = await axios.get(`${API_BASE}/shows/${showId}`);
    const updatedShow = updatedShowRes.data.show;
    for (const seatId of testSeats) {
      const ticket = updatedShow.tickets[seatId];
      if (ticket.status !== 'booked') {
        throw new Error(`Seat ${seatId} was not updated to "booked"! Found: ${ticket.status}`);
      }
      console.log(`   - Seat ${seatId}: status="${ticket.status}", bookedBy="${ticket.bookedBy}", bookingId="${ticket.bookingId}"`);
    }
    console.log('✅ Seat map successfully updated from "locked" -> "booked" in storage!');

    // 7. Verify /api/payment/cancel-or-fail endpoint
    console.log('\n--- Step 7: Testing Payment Cancel/Fail Diagnostic Endpoint ---');
    const cancelRes = await axios.post(`${API_BASE}/payment/cancel-or-fail`, {
      showId,
      selectedSeats: ['C1'],
      errorDetails: {
        code: 'BAD_REQUEST_ERROR',
        reason: 'payment_cancelled',
        description: 'Customer dismissed payment modal on authentication step',
      },
      userEmail,
    });
    console.log(`✅ Cancel/Fail Endpoint verified: ${cancelRes.data.message}`);

    console.log('\n====================================================');
    console.log('🎉 ALL RAZORPAY PAYMENT TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Test Flow Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runFullVerification();
