require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const { initStore, store } = require('./data/store');

const testApiFlow = async () => {
  console.log('🧪 Testing Auth & Email API Endpoints in Express...\n');
  await initStore();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/email', emailRoutes);

  const server = app.listen(5099, async () => {
    try {
      const baseUrl = 'http://localhost:5099';

      // 1. Register test user
      console.log('1. Testing POST /api/auth/register');
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'tester_' + Date.now(),
          email: 'en24cs3010918@medicaps.ac.in',
          password: 'password123',
        }),
      });
      const regData = await regRes.json();
      console.log('Register Response:', regData);
      if (!regData.success || !regData.requiresOtp) {
        throw new Error('Register failed: ' + JSON.stringify(regData));
      }

      // Check stored user OTP
      const storedUser = store.users.find((u) => u.email === 'en24cs3010918@medicaps.ac.in');
      console.log('User created in store, verificationOtp:', storedUser.verificationOtp, 'isVerified:', storedUser.isVerified);
      if (!storedUser.verificationOtp) throw new Error('Missing verification OTP in stored user');

      // 2. Test Wrong OTP
      console.log('\n2. Testing POST /api/auth/verify-otp with WRONG OTP');
      const wrongOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
          otp: '000000',
        }),
      });
      const wrongOtpData = await wrongOtpRes.json();
      console.log('Wrong OTP Response status:', wrongOtpRes.status, wrongOtpData);
      if (wrongOtpRes.status !== 400) throw new Error('Wrong OTP did not return 400');

      // 3. Test Correct OTP
      console.log('\n3. Testing POST /api/auth/verify-otp with CORRECT OTP');
      const correctOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
          otp: storedUser.verificationOtp,
        }),
      });
      const correctOtpData = await correctOtpRes.json();
      console.log('Correct OTP Response:', correctOtpData);
      if (!correctOtpData.success || !correctOtpData.token) {
        throw new Error('Verify OTP failed');
      }
      console.log('User isVerified after OTP:', storedUser.isVerified);

      // 4. Test Login
      console.log('\n4. Testing POST /api/auth/login');
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      console.log('Login Response:', loginData);
      if (!loginData.success || !loginData.token) {
        throw new Error('Login failed');
      }

      // 5. Test Forgot Password
      console.log('\n5. Testing POST /api/auth/forgot-password');
      const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
        }),
      });
      const forgotData = await forgotRes.json();
      console.log('Forgot Password Response:', forgotData);
      if (!forgotData.success) throw new Error('Forgot password failed');
      console.log('Reset OTP stored:', storedUser.resetPasswordOtp);

      // 6. Test Reset Password with OTP
      console.log('\n6. Testing POST /api/auth/reset-password');
      const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
          otp: storedUser.resetPasswordOtp,
          newPassword: 'newPassword456',
        }),
      });
      const resetData = await resetRes.json();
      console.log('Reset Password Response:', resetData);
      if (!resetData.success) throw new Error('Reset password failed');

      // 7. Test Login with new password
      console.log('\n7. Testing POST /api/auth/login with new password');
      const loginNewRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'en24cs3010918@medicaps.ac.in',
          password: 'newPassword456',
        }),
      });
      const loginNewData = await loginNewRes.json();
      console.log('New Login Response:', loginNewData);
      if (!loginNewData.success) throw new Error('Login with new password failed');

      console.log('\n🎉 ALL CONTROLLER & API ENDPOINT TESTS PASSED SUCCESSFULLY!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Endpoint Test Error:', err);
      server.close();
      process.exit(1);
    }
  });
};

testApiFlow();
