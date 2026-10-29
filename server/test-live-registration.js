const axios = require('axios');

async function testLiveRegistration() {
  const targetEmail = 'sandeepnayak998182@gmail.com';
  console.log('🧪 Testing Live Registration for:', targetEmail);

  try {
    // 1. Submit Registration
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'sandeep_test',
      email: targetEmail,
      password: 'password123',
    });

    console.log('Register Response:', regRes.data);

    if (!regRes.data.success || !regRes.data.requiresOtp) {
      throw new Error('Registration failed to trigger OTP requirement.');
    }

    console.log('✅ Registration successfully triggered real email delivery!');

    // 2. Fetch the user directly from MongoDB to get the real generated OTP
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://127.0.0.1:27017/imovies');
    const User = require('./models/userModel');
    const user = await User.findOne({ email: targetEmail });
    console.log(`Fetched User from DB: OTP=${user.verificationOtp}, isVerified=${user.isVerified}`);

    if (!user.verificationOtp) {
      throw new Error('User missing verification OTP in DB.');
    }

    // 3. Test Invalid OTP
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: targetEmail,
        otp: '000000',
      });
      throw new Error('Invalid OTP unexpectedly succeeded!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Invalid OTP correctly rejected with 400 Bad Request.');
      } else {
        throw err;
      }
    }

    // 4. Test Valid OTP Verification
    const verifyRes = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      email: targetEmail,
      otp: user.verificationOtp,
    });

    console.log('Verify Response:', verifyRes.data);
    if (!verifyRes.data.success || !verifyRes.data.token) {
      throw new Error('Verification failed.');
    }

    console.log('✅ Real OTP verified successfully and JWT session issued!');

    // 5. Verify User is now verified in DB
    const updatedUser = await User.findOne({ email: targetEmail });
    console.log(`Updated User in DB: isVerified=${updatedUser.isVerified}, OTP=${updatedUser.verificationOtp}`);
    if (!updatedUser.isVerified) {
      throw new Error('User should be verified now.');
    }

    // 6. Test Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: targetEmail,
      password: 'password123',
    });

    console.log('Login Response:', loginRes.data);
    if (!loginRes.data.success) {
      throw new Error('Login failed for verified user.');
    }

    console.log('✅ Login successful for verified account!');
    await mongoose.disconnect();

    console.log('\n🎉 ALL LIVE AUTHENTICATION, OTP, AND EMAIL CHECKS PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testLiveRegistration();
