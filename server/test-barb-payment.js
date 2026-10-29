const Razorpay = require('razorpay');
const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TpQ7mg5jyDRTt0';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '5OtY3b29pz3FK1KukmSiZqmS';
const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

async function checkPayment() {
  try {
    const res = await axios.get('https://api.razorpay.com/v1/payments/pay_TtMS0K7AFYPnPf', {
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log('Full payment entity:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

checkPayment();
