const http = require('http');

const runTests = async () => {
  // Start server locally for testing
  const app = require('./server');

  // Helper for requests
  const request = (path, method = 'GET', data = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  };

  // Wait for server to boot (connectDB timeout takes up to 2.5s)
  console.log('Waiting for iMovies server initialization...');
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      await request('/api/health');
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!ready) {
    throw new Error('Server did not become ready in time.');
  }

  console.log('\n--- STARTING COMPREHENSIVE iMOVIES REST API VERIFICATION SUITE ---\n');

  // Test 1: Health check
  const healthRes = await request('/api/health');
  console.log(`[TEST 1] GET /api/health: Status ${healthRes.status} - Integration: ${healthRes.data.marketIntegration}`);

  // Test 2: Live TMDB Movies list
  const moviesRes = await request('/api/movie');
  console.log(`[TEST 2] GET /api/movie: Status ${moviesRes.status} - Source: ${moviesRes.data.source} - Count: ${moviesRes.data.count}`);
  const liveSampleMovie = moviesRes.data.movies[0];
  console.log(`  Live Film 1: "${liveSampleMovie?.movieName}" (ID: ${liveSampleMovie?._id})`);

  // Test 3: Theatres list
  const theatresRes = await request('/api/theatre');
  console.log(`[TEST 3] GET /api/theatre: Status ${theatresRes.status} - Count: ${theatresRes.data.count}`);

  // Test 4: Live TMDB Movie Details
  const movieDetailsRes = await request(`/api/movie/${liveSampleMovie._id}`);
  console.log(`[TEST 4] GET /api/movie/${liveSampleMovie._id}: Status ${movieDetailsRes.status} - Title: "${movieDetailsRes.data.movie?.movieName}" | Director: "${movieDetailsRes.data.movie?.director}"`);

  // Test 5: Dynamic Show creation for live TMDB movie
  const showsRes = await request(`/api/shows/movie/${liveSampleMovie._id}`);
  console.log(`[TEST 5] GET /api/shows/movie/${liveSampleMovie._id}: Status ${showsRes.status} - Shows count: ${showsRes.data.count}`);
  const liveShow = showsRes.data.shows[0];

  // Test 6: User Login
  const userLoginRes = await request('/api/auth/login', 'POST', {
    email: 'user@imovies.com',
    password: 'password123',
  });
  console.log(`[TEST 6] POST /api/auth/login: Status ${userLoginRes.status} - User: ${userLoginRes.data.user?.username}`);
  const userToken = userLoginRes.data.token;

  // Test 7: Admin Login
  const adminLoginRes = await request('/api/auth/admin/login', 'POST', {
    email: 'admin@imovies.com',
    password: 'admin123',
  });
  console.log(`[TEST 7] POST /api/auth/admin/login: Status ${adminLoginRes.status} - Admin: ${adminLoginRes.data.user?.username}`);

  // Test 8: Lock Seats on Live TMDB Show with TTL
  const lockRes = await request(
    '/api/bookings/lock-seats',
    'POST',
    {
      showId: liveShow.showId,
      selectedSeats: ['B1', 'B2'],
      userEmail: 'user@imovies.com',
    },
    { Authorization: `Bearer ${userToken}` }
  );
  console.log(`[TEST 8] POST /api/bookings/lock-seats: Status ${lockRes.status} - TTL: ${lockRes.data.ttlSeconds}s - Message: ${lockRes.data.message}`);

  // Test 9: Confirm Booking for Live TMDB Movie
  const bookingRes = await request(
    '/api/bookings/confirm',
    'POST',
    {
      showId: liveShow.showId,
      selectedSeats: ['B1', 'B2'],
      userEmail: 'user@imovies.com',
      paymentMethod: 'Credit Card (Visa)',
    },
    { Authorization: `Bearer ${userToken}` }
  );
  console.log(`[TEST 9] POST /api/bookings/confirm: Status ${bookingRes.status} - Booking ID: ${bookingRes.data.booking?.bookingId} - Total: ₹${bookingRes.data.booking?.totalAmount}`);

  // Test 10: My Bookings
  const myBookingsRes = await request('/api/bookings/my-bookings', 'GET', null, {
    Authorization: `Bearer ${userToken}`,
  });
  console.log(`[TEST 10] GET /api/bookings/my-bookings: Status ${myBookingsRes.status} - User Bookings Count: ${myBookingsRes.data.count}`);

  // Test 11: Toggle Watchlist with Live TMDB Movie
  const favRes = await request(
    '/api/favorite/toggle',
    'POST',
    {
      movieId: liveSampleMovie._id,
      userEmail: 'user@imovies.com',
    },
    { Authorization: `Bearer ${userToken}` }
  );
  console.log(`[TEST 11] POST /api/favorite/toggle: Status ${favRes.status} - Action: ${favRes.data.action}`);

  // Test 12: Post Review for Live TMDB Movie
  const reviewRes = await request(
    '/api/review',
    'POST',
    {
      movieId: liveSampleMovie._id,
      rating: 5,
      reviewText: 'Sensational live market movie! Watched in IMAX with unforgettable sound.',
      userEmail: 'user@imovies.com',
    },
    { Authorization: `Bearer ${userToken}` }
  );
  console.log(`[TEST 12] POST /api/review: Status ${reviewRes.status} - Review ID: ${reviewRes.data.review?._id}`);

  // Test 13: Razorpay Create Order
  const rzpOrderRes = await request('/api/payment/create-order', 'POST', {
    amount: 700,
    showId: liveShow.showId,
    selectedSeats: ['C1', 'C2'],
    userEmail: 'user@imovies.com',
  }, { Authorization: `Bearer ${userToken}` });
  console.log(`[TEST 13] POST /api/payment/create-order: Status ${rzpOrderRes.status} - Order ID: ${rzpOrderRes.data.order_id} - Key ID: ${rzpOrderRes.data.key_id}`);

  // Test 14: Razorpay HMAC Signature Verification
  const crypto = require('crypto');
  const fakePayId = `pay_${Date.now()}`;
  const validSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS')
    .update(`${rzpOrderRes.data.order_id}|${fakePayId}`)
    .digest('hex');

  const rzpVerifyRes = await request('/api/payment/verify', 'POST', {
    razorpay_order_id: rzpOrderRes.data.order_id,
    razorpay_payment_id: fakePayId,
    razorpay_signature: validSig,
    bookingDetails: {
      showId: liveShow.showId,
      selectedSeats: ['C1', 'C2'],
      totalAmount: 700,
      userEmail: 'user@imovies.com',
      paymentMethod: 'Razorpay (Test Mode)',
    },
  }, { Authorization: `Bearer ${userToken}` });
  console.log(`[TEST 14] POST /api/payment/verify: Status ${rzpVerifyRes.status} - Verified Booking ID: ${rzpVerifyRes.data.booking?.bookingId}`);

  console.log('\n--- ALL TMDB & RAZORPAY TEST SUITE COMPLETED SUCCESSFULLY! ---\n');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
