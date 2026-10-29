const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

async function testSend() {
  try {
    const payload = {
      sender: {
        name: 'iMovies',
        email: 'sandeepnayak998182@gmail.com',
      },
      to: [
        {
          email: 'sandeepnayak998182@gmail.com',
          name: 'Sandeep Nayak',
        },
      ],
      subject: '🎬 Test iMovies Verification Code',
      htmlContent: '<h3>Your iMovies OTP is 123456</h3>',
    };

    const res = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('Dispatch Success:', res.data);

    // Wait 3 seconds and check events
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const eventsRes = await axios.get('https://api.brevo.com/v3/smtp/statistics/events', {
      headers: { 'api-key': process.env.BREVO_API_KEY },
      params: {
        limit: 5,
        sort: 'desc',
      },
    });

    console.log('Latest Event for Message:', JSON.stringify(eventsRes.data.events.slice(0, 3), null, 2));
  } catch (err) {
    console.error('Send Error:', err.response?.data || err.message);
  }
}

testSend();
