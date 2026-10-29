const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

const apiKey = process.env.BREVO_API_KEY;

async function checkEvents() {
  try {
    const res = await axios.get('https://api.brevo.com/v3/smtp/statistics/events', {
      headers: { 'api-key': apiKey },
      params: {
        limit: 20,
        sort: 'desc',
      },
    });
    console.log('Recent Events:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching events:', err.response?.data || err.message);
  }
}

checkEvents();
