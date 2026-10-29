const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const Favorite = require('../models/favoriteModel');
const { store, initStore } = require('../data/store');

const seedDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  try {
    await mongoose.connect(mongoURI);
    console.log(`Connected to MongoDB at ${mongoURI}`);

    await initStore();

    // Clear existing collections
    await User.deleteMany();
    await Admin.deleteMany();
    await Movie.deleteMany();
    await Theatre.deleteMany();
    await Show.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Favorite.deleteMany();

    console.log('Cleared existing collections...');

    // Insert seeds from store
    await User.insertMany(store.users);
    await Admin.insertMany(store.admins);
    await Movie.insertMany(store.movies);
    await Theatre.insertMany(store.theatres);
    await Show.insertMany(store.shows);
    await Booking.insertMany(store.bookings);
    await Review.insertMany(store.reviews);
    await Favorite.insertMany(store.favorites);

    console.log('✅ Successfully seeded all iMovies collections!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();
