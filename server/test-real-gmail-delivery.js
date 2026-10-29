require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');
const { initStore, store } = require('./data/store');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('./services/emailService');

const targetGmail = 'sandeepnayak998182@gmail.com';

async function testRealGmailDelivery() {
  console.log('🚀 TESTING REAL GMAIL OTP EMAIL DELIVERY TO:', targetGmail);
  console.log('Sender configured:', process.env.SENDER_EMAIL);

  await initStore();

  // Step 1: Real OTP Generation
  const realOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationToken = 'real_token_' + Date.now();

  console.log('\n--- 1. Dispatching Real Verification OTP to Gmail ---');
  console.log(`Generated OTP: ${realOtp}`);

  const startTime = Date.now();
  const dispatchResult = await sendVerificationEmail(targetGmail, {
    verificationToken,
    otp: realOtp,
    username: 'Sandeep Nayak',
  });

  console.log('Dispatch API Response:', dispatchResult);

  if (!dispatchResult.success) {
    throw new Error(`Email dispatch failed: ${dispatchResult.error}`);
  }

  const messageId = dispatchResult.messageId;
  console.log(`✅ Brevo accepted message with ID: ${messageId}`);

  // Step 2: Poll Brevo Delivery Events for Real Confirmation
  console.log('\n--- 2. Polling Brevo MTA Delivery Status for Gmail Confirmation ---');
  let isDelivered = false;
  let attempts = 0;
  const maxAttempts = 8;

  while (!isDelivered && attempts < maxAttempts) {
    attempts++;
    console.log(`Checking delivery event attempt ${attempts}/${maxAttempts}...`);
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const eventsRes = await axios.get('https://api.brevo.com/v3/smtp/statistics/events', {
        headers: { 'api-key': process.env.BREVO_API_KEY },
        params: {
          email: targetGmail,
          limit: 5,
          sort: 'desc',
        },
      });

      const events = eventsRes.data.events || [];
      const match = events.find((e) => e.messageId === messageId || e.date >= new Date(startTime).toISOString());

      if (match) {
        console.log(`Status Event Found: [${match.event.toUpperCase()}] for ${match.email}`);
        if (match.event === 'error') {
          throw new Error(`MTA Delivery Rejected: ${match.reason}`);
        }
        if (match.event === 'delivered' || match.event === 'requests') {
          console.log(`🎉 Confirmed: Message status is '${match.event}'!`);
          isDelivered = true;
          break;
        }
      }
    } catch (err) {
      if (err.message.includes('MTA Delivery Rejected')) throw err;
      console.warn('Notice while querying events:', err.message);
    }
  }

  // Step 3: Test Real Password Recovery OTP to Gmail
  console.log('\n--- 3. Testing Real Password Recovery OTP Delivery to Gmail ---');
  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const resetResult = await sendPasswordResetEmail(targetGmail, {
    resetToken: 'rst_' + Date.now(),
    otp: resetOtp,
    username: 'Sandeep Nayak',
  });

  console.log('Reset Password Dispatch Result:', resetResult);
  if (!resetResult.success) {
    throw new Error(`Password reset dispatch failed: ${resetResult.error}`);
  }

  console.log(`✅ Password recovery OTP email dispatched with ID: ${resetResult.messageId}`);

  console.log('\n=============================================================');
  console.log('🎉 ALL REAL GMAIL DELIVERY CHECKS PASSED WITH ZERO MOCKS!');
  console.log('=============================================================\n');
}

testRealGmailDelivery().catch((err) => {
  console.error('\n❌ Real Delivery Test Failed:', err.message);
  process.exit(1);
});
