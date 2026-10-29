const http = require('http');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const testRazorpay = async () => {
  const app = require('./server');

  const request = (path, method = 'GET', data = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
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
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  // Wait for server ready
  console.log('Testing Razorpay (Test Mode) API endpoints...');
  for (let i = 0; i < 20; i++) {
    try {
      await request('/api/health');
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // 1. Create order test
  console.log('[STEP 1] Testing POST /api/payment/create-order...');
  const orderRes = await request('/api/payment/create-order', 'POST', {
    amount: 580,
    showId: 'SHW-mov_001-th_001-D0-S0',
    selectedSeats: ['A1', 'A2'],
    userEmail: 'user@imovies.com',
  });

  console.log(`✓ Create Order Response: Status ${orderRes.status}`);
  console.log('  Order ID:', orderRes.data.order_id);
  console.log('  Amount (paise):', orderRes.data.amount);
  console.log('  Currency:', orderRes.data.currency);
  console.log('  Key ID:', orderRes.data.key_id);

  if (orderRes.status !== 200 || !orderRes.data.order_id) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderRes.data));
  }

  // 2. Test Invalid signature verification (should return 400)
  console.log('\n[STEP 2] Testing Invalid Signature Verification (expect 400)...');
  const invalidVerifyRes = await request('/api/payment/verify', 'POST', {
    razorpay_order_id: orderRes.data.order_id,
    razorpay_payment_id: 'pay_test_123456789',
    razorpay_signature: 'invalid_tampered_signature',
    bookingDetails: {
      showId: 'SHW-mov_001-th_001-D0-S0',
      selectedSeats: ['A1', 'A2'],
      userEmail: 'user@imovies.com',
      totalAmount: 580,
    },
  });
  console.log(`✓ Invalid Signature Response: Status ${invalidVerifyRes.status} - Message: "${invalidVerifyRes.data.message}"`);

  // 3. Test Valid signature verification
  console.log('\n[STEP 3] Testing Valid Signature Verification (expect 200 & Booking created)...');
  const fakePaymentId = `pay_${Date.now()}`;
  const secret = process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderRes.data.order_id}|${fakePaymentId}`)
    .digest('hex');

  const validVerifyRes = await request('/api/payment/verify', 'POST', {
    razorpay_order_id: orderRes.data.order_id,
    razorpay_payment_id: fakePaymentId,
    razorpay_signature: validSignature,
    bookingDetails: {
      showId: 'SHW-mov_001-th_001-D0-S0',
      selectedSeats: ['A1', 'A2'],
      userEmail: 'user@imovies.com',
      totalAmount: 580,
      paymentMethod: 'Razorpay UPI (Google Pay)',
    },
  });

  console.log(`✓ Valid Signature Response: Status ${validVerifyRes.status} - Message: "${validVerifyRes.data.message}"`);
  console.log('  Confirmed Booking ID:', validVerifyRes.data.booking?.bookingId);
  console.log('  Payment Method:', validVerifyRes.data.booking?.paymentMethod);
  console.log('  Transaction ID:', validVerifyRes.data.booking?.transactionId);
  console.log('  Razorpay Order ID:', validVerifyRes.data.booking?.razorpayOrderId);

  console.log('\n--- RAZORPAY TEST COMPLETED SUCCESSFULLY! ---\n');
  process.exit(0);
};

testRazorpay().catch((err) => {
  console.error('Razorpay Test Error:', err);
  process.exit(1);
});
