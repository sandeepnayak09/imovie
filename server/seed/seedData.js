const mongoose = require('mongoose');
const dotenv = require('dotenv');

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

const seedDB = async (targetURI) => {
  const mongoURI = targetURI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  try {
    console.log(`📡 Connecting to MongoDB at: ${mongoURI.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(` Connected to MongoDB successfully!`);

    await initStore();

    // Clear existing collections safely
    await User.deleteMany();
    await Admin.deleteMany();
    await Movie.deleteMany();
    await Theatre.deleteMany();
    await Show.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Favorite.deleteMany();

    console.log('🧹 Cleared existing collections in target MongoDB database.');

    // 1. Insert Users & Admins (clean ObjectIds)
    const usersToInsert = store.users.map(({ _id, ...u }) => u);
    const adminsToInsert = store.admins.map(({ _id, ...a }) => a);
    await User.insertMany(usersToInsert);
    await Admin.insertMany(adminsToInsert);
    console.log(`✅ Seeded ${usersToInsert.length} Users and ${adminsToInsert.length} Admins.`);

    // 2. Insert Movies (clean ObjectIds)
    const moviesToInsert = store.movies.map(({ _id, ...m }) => m);
    await Movie.insertMany(moviesToInsert);
    console.log(`✅ Seeded ${moviesToInsert.length} Movies.`);

    // 3. Insert Theatres & Shows (Preserves string IDs and seat layouts)
    await Theatre.insertMany(store.theatres);
    await Show.insertMany(store.shows);
    console.log(`✅ Seeded ${store.theatres.length} Theatres and ${store.shows.length} Shows with full seat layouts.`);

    // 4. Insert Reviews & Favorites
    if (store.reviews && store.reviews.length > 0) {
      const reviewsToInsert = store.reviews.map(({ _id, ...r }) => r);
      await Review.insertMany(reviewsToInsert);
      console.log(`✅ Seeded ${reviewsToInsert.length} Reviews.`);
    }

    if (store.favorites && store.favorites.length > 0) {
      const favsToInsert = store.favorites.map(({ _id, ...f }) => f);
      await Favorite.insertMany(favsToInsert);
      console.log(`✅ Seeded ${favsToInsert.length} Favorites.`);
    }

    console.log('=====================================================');
    console.log('🎉 Successfully pushed all iMovies data to MongoDB!');
    console.log('=====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

const customUri = process.argv[2];
seedDB(customUri);
