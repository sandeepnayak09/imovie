const { getIsConnected } = require('../config/db');
const { store, cleanupExpiredSeatLocks, formatDateStr } = require('../data/store');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const { getMovieDetails } = require('../services/tmdbService');

// Helper to construct interactive auditorium seat map from theatre layout
const buildTicketsFromTheatre = (theatre) => {
  const tickets = {};

  // Balcony
  if (theatre.balconySeats && theatre.balconySeats.rows) {
    theatre.balconySeats.rows.forEach((row) => {
      const seatsCount = Number(theatre.balconySeats.seatsPerRow) || 10;
      for (let i = 1; i <= seatsCount; i++) {
        const seatId = `${row}${i}`;
        // Pre-reserve a couple of seats for realistic active auditorium appearance
        const isPrebooked = row === 'A' && (i === 4 || i === 5);
        tickets[seatId] = {
          seatId,
          tier: 'Balcony',
          price: Number(theatre.balconySeatPrice) || 500,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'patron@imovies.com' : null,
        };
      }
    });
  }

  // Middle
  if (theatre.middleSeats && theatre.middleSeats.rows) {
    theatre.middleSeats.rows.forEach((row) => {
      const seatsCount = Number(theatre.middleSeats.seatsPerRow) || 12;
      for (let i = 1; i <= seatsCount; i++) {
        const seatId = `${row}${i}`;
        const isPrebooked =
          (row === 'C' && (i === 6 || i === 7)) ||
          (row === 'D' && (i === 5 || i === 6 || i === 7));
        tickets[seatId] = {
          seatId,
          tier: 'Middle',
          price: Number(theatre.middleSeatPrice) || 350,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'patron@imovies.com' : null,
        };
      }
    });
  }

  // Lower
  if (theatre.lowerSeats && theatre.lowerSeats.rows) {
    theatre.lowerSeats.rows.forEach((row) => {
      const seatsCount = Number(theatre.lowerSeats.seatsPerRow) || 12;
      for (let i = 1; i <= seatsCount; i++) {
        const seatId = `${row}${i}`;
        const isPrebooked = row === 'F' && i === 3;
        tickets[seatId] = {
          seatId,
          tier: 'Lower',
          price: Number(theatre.lowerSeatPrice) || 240,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'patron@imovies.com' : null,
        };
      }
    });
  }

  return tickets;
};

// Helper to auto-schedule shows for any TMDB or newly discovered movie
const ensureShowsExistForMovie = async (movieId) => {
  if (!movieId) return;
  const cleanMovieId = String(movieId).trim();

  // Determine movie title
  let movieTitle = 'Feature Film';
  try {
    const tmdbDetails = await getMovieDetails(cleanMovieId);
    if (tmdbDetails?.movieName) {
      movieTitle = tmdbDetails.movieName;
    }
  } catch {}

  if (movieTitle === 'Feature Film' && getIsConnected()) {
    try {
      const localMovie = await Movie.findById(cleanMovieId);
      if (localMovie?.movieName) movieTitle = localMovie.movieName;
    } catch {}
  }

  // Fetch available theatres
  let theatresList = [];
  if (getIsConnected()) {
    try {
      theatresList = await Theatre.find();
    } catch (e) {
      console.warn('Notice loading theatres from Mongo:', e.message);
    }
  }

  if (!theatresList || theatresList.length === 0) {
    theatresList = store.theatres;
  }

  if (!theatresList || theatresList.length === 0) {
    console.warn('⚠️ No theatres registered in database or store to schedule shows.');
    return;
  }

  const times = ['10:30 AM', '02:15 PM', '06:45 PM', '09:30 PM'];
  const today = new Date();
  const createdShows = [];

  // Guarantee shows exist for each of the next 4 active calendar days
  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    const showDateObj = new Date(today);
    showDateObj.setDate(today.getDate() + dayOffset);
    showDateObj.setHours(0, 0, 0, 0);

    const showDateString = formatDateStr(showDateObj);

    // Check if shows already exist for this movie on this date string
    let dateShowsCount = 0;
    if (getIsConnected()) {
      try {
        dateShowsCount = await Show.countDocuments({
          movieId: cleanMovieId,
          showDateString,
        });
      } catch (err) {
        console.warn('Notice checking date shows in Mongo:', err.message);
      }
    }

    if (dateShowsCount === 0) {
      const storeCount = store.shows.filter(
        (s) => String(s.movieId) === cleanMovieId && s.showDateString === showDateString
      ).length;
      dateShowsCount = storeCount;
    }

    // If no shows are scheduled for this date, schedule shows across all theatres
    if (dateShowsCount === 0) {
      theatresList.forEach((theatre, tIdx) => {
        // 2 distinct time slots per theatre per day
        const slot1 = times[(tIdx + dayOffset) % times.length];
        const slot2 = times[(tIdx + dayOffset + 2) % times.length];

        [slot1, slot2].forEach((timeSlot, sIdx) => {
          const theatreIdSlug = theatre._id || theatre.theatreName.replace(/[^a-zA-Z0-9]/g, '');
          const showId = `SHW-${cleanMovieId}-${theatreIdSlug}-D${dayOffset}-S${sIdx}`;

          const newShow = {
            _id: showId,
            showId,
            adminEmail: 'admin@imovies.com',
            movieId: cleanMovieId,
            movieName: movieTitle,
            theatreName: theatre.theatreName,
            theatreLocation: theatre.location,
            city: theatre.city || theatre.location.split(',').pop().trim(),
            screenFormat: tIdx % 2 === 0 ? 'IMAX 4K Laser' : 'Dolby Atmos 7.1',
            showDate: showDateObj,
            showDateString,
            showTime: timeSlot,
            tickets: buildTicketsFromTheatre(theatre),
            createdAt: new Date(),
          };

          createdShows.push(newShow);

          // Add to in-memory store if not present
          const existingInStore = store.shows.find((s) => s.showId === showId);
          if (!existingInStore) {
            store.shows.push(newShow);
          }
        });
      });
    }
  }

  // Insert into MongoDB if connected
  if (getIsConnected() && createdShows.length > 0) {
    try {
      await Show.insertMany(createdShows, { ordered: false });
      console.log(`🎬 Auto-scheduled ${createdShows.length} live shows for movie "${movieTitle}" (ID: ${cleanMovieId})`);
    } catch (e) {
      // Ignore duplicate key errors if any parallel request scheduled simultaneously
    }
  }
};

// @desc    Get all shows for a movie, optionally filtered by date and city
// @route   GET /api/shows/movie/:movieId
const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date, city } = req.query;

    const cleanMovieId = String(movieId).trim();

    // 1. Ensure shows are scheduled for all active dates
    await ensureShowsExistForMovie(cleanMovieId);

    const targetDateStr = date ? String(date).split('T')[0] : formatDateStr(new Date());

    if (getIsConnected()) {
      const query = { movieId: cleanMovieId };

      if (targetDateStr) {
        const targetDate = new Date(targetDateStr);
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        query.$or = [
          { showDateString: targetDateStr },
          {
            showDate: {
              $gte: new Date(targetDateStr + 'T00:00:00.000Z'),
              $lte: new Date(targetDateStr + 'T23:59:59.999Z'),
            },
          },
          { showDate: { $gte: startOfDay, $lte: endOfDay } },
        ];
      }

      if (city && city !== 'All') {
        const cityRegex = new RegExp(city.trim(), 'i');
        const cityFilter = {
          $or: [{ city: cityRegex }, { theatreLocation: cityRegex }, { theatreName: cityRegex }],
        };
        query.$and = [cityFilter];
      }

      let shows = await Show.find(query).sort({ theatreName: 1, showTime: 1 });

      // Run cleanup on locks
      for (const show of shows) {
        if (cleanupExpiredSeatLocks(show)) {
          show.markModified('tickets');
          await show.save();
        }
      }

      // Compute seat availability metadata for each show
      const enrichedShows = shows.map((s) => {
        const showObj = s.toObject ? s.toObject() : s;
        const ticketsList = Object.values(showObj.tickets || {});
        const totalSeats = ticketsList.length || 60;
        const availableSeats = ticketsList.filter((t) => t.status === 'available').length;
        const bookedSeats = ticketsList.filter((t) => t.status === 'booked').length;
        const fillPercentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

        return {
          ...showObj,
          totalSeats,
          availableSeats,
          bookedSeats,
          fillPercentage,
          isFastFilling: fillPercentage >= 35,
          isSoldOut: availableSeats === 0,
        };
      });

      return res.json({
        success: true,
        count: enrichedShows.length,
        movieId: cleanMovieId,
        date: targetDateStr,
        city: city || 'All',
        shows: enrichedShows,
      });
    } else {
      // In-Memory store fallback
      let filtered = store.shows.filter((s) => String(s.movieId) === cleanMovieId);

      if (targetDateStr) {
        filtered = filtered.filter((s) => {
          const sDateStr =
            s.showDateString || (s.showDate ? formatDateStr(s.showDate) : '');
          return sDateStr === targetDateStr;
        });
      }

      if (city && city !== 'All') {
        const qCity = city.toLowerCase().trim();
        filtered = filtered.filter(
          (s) =>
            (s.city && s.city.toLowerCase().includes(qCity)) ||
            (s.theatreLocation && s.theatreLocation.toLowerCase().includes(qCity)) ||
            (s.theatreName && s.theatreName.toLowerCase().includes(qCity))
        );
      }

      filtered.forEach((show) => cleanupExpiredSeatLocks(show));

      const enrichedShows = filtered.map((show) => {
        const ticketsList = Object.values(show.tickets || {});
        const totalSeats = ticketsList.length || 60;
        const availableSeats = ticketsList.filter((t) => t.status === 'available').length;
        const bookedSeats = ticketsList.filter((t) => t.status === 'booked').length;
        const fillPercentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

        return {
          ...show,
          totalSeats,
          availableSeats,
          bookedSeats,
          fillPercentage,
          isFastFilling: fillPercentage >= 35,
          isSoldOut: availableSeats === 0,
        };
      });

      return res.json({
        success: true,
        count: enrichedShows.length,
        movieId: cleanMovieId,
        date: targetDateStr,
        city: city || 'All',
        shows: enrichedShows,
      });
    }
  } catch (error) {
    console.error('getShowsByMovie Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching shows.' });
  }
};

// @desc    Get single show details and live ticket map
// @route   GET /api/shows/:showId
const getShowById = async (req, res) => {
  try {
    const { showId } = req.params;

    if (getIsConnected()) {
      let show = await Show.findOne({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });

      if (!show) {
        show = store.shows.find((s) => s.showId === showId || s._id === showId);
      }

      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      if (cleanupExpiredSeatLocks(show)) {
        if (show.markModified) {
          show.markModified('tickets');
          await show.save();
        }
      }

      return res.json({ success: true, show });
    } else {
      const show = store.shows.find((s) => s.showId === showId || s._id === showId);
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }

      cleanupExpiredSeatLocks(show);
      return res.json({ success: true, show });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching show.' });
  }
};

// @desc    Create a new show schedule (Admin)
// @route   POST /api/shows
const createShow = async (req, res) => {
  try {
    const { movieId, theatreName, showDate, showTime, screenFormat, city } = req.body;
    const adminEmail = req.admin?.email || req.body.adminEmail || 'admin@imovies.com';

    if (!movieId || !theatreName || !showDate || !showTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide movieId, theatreName, showDate, and showTime.',
      });
    }

    let movieTitle = 'Feature Film';
    let theatreObj = null;

    if (getIsConnected()) {
      const movie = await Movie.findById(movieId);
      if (movie) {
        movieTitle = movie.movieName;
      } else {
        const tmdbDetails = await getMovieDetails(movieId);
        if (tmdbDetails) movieTitle = tmdbDetails.movieName;
      }

      theatreObj = await Theatre.findOne({ theatreName });
      if (!theatreObj) {
        theatreObj = await Theatre.findOne();
      }
    } else {
      const movie = store.movies.find((m) => String(m._id) === String(movieId) || String(m.id) === String(movieId));
      if (movie) {
        movieTitle = movie.movieName;
      } else {
        const tmdbDetails = await getMovieDetails(movieId);
        if (tmdbDetails) movieTitle = tmdbDetails.movieName;
      }

      theatreObj = store.theatres.find((t) => t.theatreName === theatreName) || store.theatres[0];
    }

    if (!theatreObj) {
      return res.status(400).json({ success: false, message: 'Specified theatre not found to construct seating map.' });
    }

    const ticketsMap = buildTicketsFromTheatre(theatreObj);
    const uniqueShowId = `SHW-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const showDateObj = new Date(showDate);
    const showDateString = formatDateStr(showDateObj);

    const showData = {
      _id: uniqueShowId,
      adminEmail,
      showId: uniqueShowId,
      movieId: String(movieId),
      movieName: movieTitle,
      theatreName: theatreObj.theatreName,
      theatreLocation: theatreObj.location,
      city: city || theatreObj.city || 'National',
      screenFormat: screenFormat || 'IMAX 4K Laser',
      showDate: showDateObj,
      showDateString,
      showTime,
      tickets: ticketsMap,
    };

    if (getIsConnected()) {
      const newShow = await Show.create(showData);
      return res.status(201).json({ success: true, message: 'Show scheduled successfully!', show: newShow });
    } else {
      const newShow = {
        ...showData,
        createdAt: new Date(),
      };
      store.shows.push(newShow);
      return res.status(201).json({ success: true, message: 'Show scheduled successfully!', show: newShow });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error creating show.' });
  }
};

// @desc    Delete show schedule
// @route   DELETE /api/shows/:showId
const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    if (getIsConnected()) {
      const show = await Show.findOneAndDelete({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }
      return res.json({ success: true, message: 'Show schedule deleted successfully.' });
    } else {
      const idx = store.shows.findIndex((s) => s.showId === showId || s._id === showId);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Show not found.' });
      }
      store.shows.splice(idx, 1);
      return res.json({ success: true, message: 'Show schedule deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting show.' });
  }
};

// @desc    Get all shows for Admin overview
// @route   GET /api/shows
const getAllShows = async (req, res) => {
  try {
    if (getIsConnected()) {
      const shows = await Show.find().sort({ showDate: -1 });
      return res.json({ success: true, count: shows.length, shows });
    } else {
      return res.json({ success: true, count: store.shows.length, shows: store.shows });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
  getShowsByMovie,
  getShowById,
  createShow,
  deleteShow,
  getAllShows,
};
