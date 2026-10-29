const mongoose = require('mongoose');
const Show = require('./models/showModel');

async function testCreate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/imovies');
  try {
    const res = await Show.create({
      _id: 'SHW-TEST-1',
      showId: 'SHW-TEST-1',
      adminEmail: 'admin@imovies.com',
      movieId: '123',
      theatreName: 'PVR',
      showDate: new Date(),
      showTime: '10:00 AM',
      tickets: { A1: { seatId: 'A1', price: 200, status: 'available' } },
    });
    console.log('Created successfully:', res);
  } catch (err) {
    console.error('FAILED WITH:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testCreate();
