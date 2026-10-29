const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getIsConnected } = require('./config/db');
const { initStore, store, cleanupExpiredSeatLocks } = require('./data/store');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const Show = require('./models/showModel');
const { getLiveMarketCatalog } = require('./services/tmdbService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'iMovies REST API Engine',
    database: getIsConnected() ? 'MongoDB Production Cluster' : 'In-Memory ODM Fallback Engine',
    marketIntegration: 'TMDB (The Movie Database) Live API v3',
    version: '2.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/theatre', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/email', emailRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Background Seat Lock TTL Sweeper (runs every 30 seconds)
setInterval(async () => {
  try {
    if (getIsConnected()) {
      const shows = await Show.find({});
      for (const show of shows) {
        if (cleanupExpiredSeatLocks(show)) {
          show.markModified('tickets');
          await show.save();
        }
      }
    } else {
      store.shows.forEach((show) => cleanupExpiredSeatLocks(show));
    }
  } catch (err) {
    console.error('Seat lock cleanup error:', err.message);
  }
}, 30000);

// Initialize DB, warm live TMDB market catalog, and launch server
const startServer = async () => {
  await connectDB();
  await initStore();

  // Pre-warm TMDB real-time market catalog in the background
  getLiveMarketCatalog().catch((e) =>
    console.warn('Initial TMDB cache warm-up notice:', e.message)
  );

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🎬 iMovies API Server is live on port ${PORT}`);
    console.log(`⚡ Mode: ${getIsConnected() ? 'MongoDB ODM' : 'In-Memory / Store'}`);
    console.log(`📡 TMDB Service: Real-time Live Market Catalog Active`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
};

startServer();

module.exports = app;
