const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

const apiKey = process.env.BREVO_API_KEY;

async function checkSenders() {
  try {
    const res = await axios.get('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey },
    });
    console.log('Senders List:', JSON.stringify(res.data, null, 2));

    const accountRes = await axios.get('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey },
    });
    console.log('Account Details:', JSON.stringify(accountRes.data, null, 2));
  } catch (err) {
    console.error('Error fetching senders/account:', err.response?.data || err.message);
  }
}

checkSenders();
