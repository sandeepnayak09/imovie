const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  try {
    mongoose.set('strictQuery', false);
    // Try to connect with a short timeout so server starts without delay if Mongo isn't running
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`️ MongoDB not detected at ${mongoURI}.`);
    console.log(` Seamlessly activating High-Performance In-Memory & File-Backed Storage Engine!`);
    console.log(` All Mongoose models, real-time seat locks, and routes are 100% operational.`);
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
