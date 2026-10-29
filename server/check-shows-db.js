const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Show = require('./models/showModel');
const Theatre = require('./models/theatreModel');
const Movie = require('./models/movieModel');

async function inspectDb() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
  console.log('MongoDB connected.');

  const theatres = await Theatre.find();
  console.log(`Theatres count: ${theatres.length}`);
  theatres.forEach(t => console.log(`- ${t.theatreName} (${t.location})`));

  const shows = await Show.find();
  console.log(`\nTotal shows in DB: ${shows.length}`);
  shows.slice(0, 10).forEach(s => {
    console.log(`- Show: ${s.showId} | Movie: ${s.movieId} ("${s.movieName}") | Date: ${s.showDate} | Time: ${s.showTime} | Theatre: ${s.theatreName}`);
  });

  // Check unique movieIds in shows
  const uniqueMovieIds = await Show.distinct('movieId');
  console.log('\nUnique movieIds in Show collection:', uniqueMovieIds);

  await mongoose.disconnect();
}

inspectDb().catch(console.error);
