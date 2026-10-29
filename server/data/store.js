const bcrypt = require('bcryptjs');
const { getIsConnected } = require('../config/db');

// In-memory data collections
const store = {
  users: [],
  admins: [],
  movies: [],
  theatres: [],
  shows: [],
  bookings: [],
  favorites: [],
  reviews: [],
};

// Real-time seat lock TTL manager
const SEAT_LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes lock TTL

// Helper to auto-expire locked seats for a show
const cleanupExpiredSeatLocks = (show) => {
  if (!show || !show.tickets) return false;
  const now = Date.now();
  let modified = false;

  for (const [seatId, ticket] of Object.entries(show.tickets)) {
    if (ticket.status === 'locked' && ticket.lockExpiresAt) {
      const expiresAt = new Date(ticket.lockExpiresAt).getTime();
      if (now > expiresAt) {
        show.tickets[seatId] = {
          ...ticket,
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          lockedAt: null,
        };
        modified = true;
      }
    }
  }
  return modified;
};

// Helper to format Date as local YYYY-MM-DD
const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Seed initial dataset
const initStore = async () => {
  // Only initialize in-memory store once
  if (store.movies.length > 0 && store.theatres.length > 0) {
    await syncToMongoIfConnected();
    return;
  }

  const hashedPasswordUser = await bcrypt.hash('password123', 10);
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);

  // 1. Users & Admins
  store.users = [
    {
      _id: 'user_001',
      username: 'john_doe',
      email: 'user@imovies.com',
      password: hashedPasswordUser,
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
    },
    {
      _id: 'user_002',
      username: 'sarah_connor',
      email: 'sarah@imovies.com',
      password: hashedPasswordUser,
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
    },
  ];

  store.admins = [
    {
      _id: 'admin_001',
      username: 'prime_admin',
      email: 'admin@imovies.com',
      password: hashedPasswordAdmin,
      role: 'admin',
      createdAt: new Date(),
    },
  ];

  // 2. Real Multiplex Theatres across Major Cities
  store.theatres = [
    {
      _id: 'th_001',
      theatreName: "PVR Director's Cut, Ambience Mall",
      location: 'Vasant Kunj, New Delhi',
      city: 'New Delhi',
      balconySeatPrice: 550,
      middleSeatPrice: 380,
      lowerSeatPrice: 260,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['Dolby Atmos 7.1', 'Laser IMAX', 'VIP Recliner Seating', 'Gourmet In-Seat Dining'],
      createdAt: new Date(),
    },
    {
      _id: 'th_002',
      theatreName: 'INOX Megaplex, Phoenix Marketcity',
      location: 'Kurla West, Mumbai',
      city: 'Mumbai',
      balconySeatPrice: 500,
      middleSeatPrice: 350,
      lowerSeatPrice: 240,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['4K Dolby Vision', 'Barco RGB Laser', 'Plush Loungers', 'Prime Sound'],
      createdAt: new Date(),
    },
    {
      _id: 'th_003',
      theatreName: 'Cinepolis IMAX, Forum Shantiniketan',
      location: 'Whitefield, Bengaluru',
      city: 'Bengaluru',
      balconySeatPrice: 480,
      middleSeatPrice: 340,
      lowerSeatPrice: 220,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['IMAX with Laser', 'RealD 3D', 'Comfort Recliners', 'Dolby Surround 7.1'],
      createdAt: new Date(),
    },
    {
      _id: 'th_004',
      theatreName: 'Prasads Multiplex, IMAX Road',
      location: 'Khairatabad, Hyderabad',
      city: 'Hyderabad',
      balconySeatPrice: 450,
      middleSeatPrice: 320,
      lowerSeatPrice: 200,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['Large Screen Experience', 'Dolby Atmos', 'Pushback Chairs', 'Laser Projection'],
      createdAt: new Date(),
    },
    {
      _id: 'th_005',
      theatreName: 'Cinepolis Nexus Indore Central',
      location: 'RNT Marg, Indore',
      city: 'Indore',
      balconySeatPrice: 420,
      middleSeatPrice: 300,
      lowerSeatPrice: 190,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['VIP Recliners', 'Dolby 7.1 Surround', 'Crisp 4K Projection', 'Cafeteria Lounge'],
      createdAt: new Date(),
    },
    {
      _id: 'th_006',
      theatreName: 'PVR Superplex, Logix City Centre',
      location: 'Sector 32, Noida',
      city: 'Noida',
      balconySeatPrice: 520,
      middleSeatPrice: 360,
      lowerSeatPrice: 250,
      balconySeats: { rows: ['A', 'B'], seatsPerRow: 10 },
      middleSeats: { rows: ['C', 'D', 'E'], seatsPerRow: 12 },
      lowerSeats: { rows: ['F', 'G'], seatsPerRow: 12 },
      facilities: ['4DX Motion Seats', 'IMAX Laser', 'Playhouse Auditorium', 'Dolby Atmos'],
      createdAt: new Date(),
    },
  ];

  // 3. Movies
  store.movies = [
    {
      _id: 'mov_001',
      movieName: 'Oppenheimer',
      description:
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, changing civilization forever.',
      genres: ['Biography', 'Drama', 'History'],
      releaseDate: new Date('2023-07-21'),
      language: 'English',
      duration: '3h 00m',
      certification: 'U/A 16+',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
      trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
      director: 'Christopher Nolan',
      cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
      imdbRating: 8.9,
      featured: true,
      createdAt: new Date(),
    },
    {
      _id: 'mov_002',
      movieName: 'Dune: Part Two',
      description:
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and destiny.',
      genres: ['Sci-Fi', 'Adventure', 'Action'],
      releaseDate: new Date('2024-03-01'),
      language: 'English',
      duration: '2h 46m',
      certification: 'U/A 13+',
      posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
      trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
      imdbRating: 8.8,
      featured: true,
      createdAt: new Date(),
    },
    {
      _id: 'mov_003',
      movieName: 'Deadpool & Wolverine',
      description:
        'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, he must team up with an even more reluctant Wolverine.',
      genres: ['Action', 'Comedy', 'Sci-Fi'],
      releaseDate: new Date('2024-07-26'),
      language: 'English',
      duration: '2h 08m',
      certification: 'A',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1jv82E9.jpg',
      trailerUrl: 'https://www.youtube.com/embed/73_1biulkYk',
      director: 'Shawn Levy',
      cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin', 'Matthew Macfadyen'],
      imdbRating: 8.0,
      featured: true,
      createdAt: new Date(),
    },
  ];

  // Helper to generate seat map with tier pricing
  const generateSeatMap = (theatre) => {
    const tickets = {};

    theatre.balconySeats.rows.forEach((row) => {
      for (let i = 1; i <= theatre.balconySeats.seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        const isPrebooked = row === 'A' && (i === 4 || i === 5);
        tickets[seatId] = {
          seatId,
          tier: 'Balcony',
          price: theatre.balconySeatPrice,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'demo_user' : null,
        };
      }
    });

    theatre.middleSeats.rows.forEach((row) => {
      for (let i = 1; i <= theatre.middleSeats.seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        const isPrebooked =
          (row === 'C' && (i === 6 || i === 7)) ||
          (row === 'D' && (i === 5 || i === 6 || i === 7));
        tickets[seatId] = {
          seatId,
          tier: 'Middle',
          price: theatre.middleSeatPrice,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'demo_user' : null,
        };
      }
    });

    theatre.lowerSeats.rows.forEach((row) => {
      for (let i = 1; i <= theatre.lowerSeats.seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        const isPrebooked = row === 'F' && i === 3;
        tickets[seatId] = {
          seatId,
          tier: 'Lower',
          price: theatre.lowerSeatPrice,
          status: isPrebooked ? 'booked' : 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: isPrebooked ? 'demo_user' : null,
        };
      }
    });

    return tickets;
  };

  // 4. Initial Shows for the upcoming 4 calendar days
  const today = new Date();
  const times = ['10:30 AM', '02:15 PM', '06:45 PM', '09:30 PM'];
  store.shows = [];

  store.movies.forEach((movie, mIdx) => {
    store.theatres.forEach((theatre, tIdx) => {
      for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
        const showDateObj = new Date(today);
        showDateObj.setDate(today.getDate() + dayOffset);
        showDateObj.setHours(0, 0, 0, 0);

        const showDateString = formatDateStr(showDateObj);

        // Pick 2 showtimes per theatre per day
        const timeSlot1 = times[(mIdx + tIdx + dayOffset) % times.length];
        const timeSlot2 = times[(mIdx + tIdx + dayOffset + 2) % times.length];

        [timeSlot1, timeSlot2].forEach((timeSlot, sIdx) => {
          const showId = `SHW-${movie._id}-${theatre._id}-D${dayOffset}-S${sIdx}`;
          store.shows.push({
            _id: showId,
            showId,
            adminEmail: 'admin@imovies.com',
            movieId: String(movie._id),
            movieName: movie.movieName,
            theatreName: theatre.theatreName,
            theatreLocation: theatre.location,
            city: theatre.city,
            screenFormat: tIdx % 2 === 0 ? 'IMAX 4K Laser' : 'Dolby Atmos 7.1',
            showDate: showDateObj,
            showDateString,
            showTime: timeSlot,
            tickets: generateSeatMap(theatre),
            createdAt: new Date(),
          });
        });
      }
    });
  });

  // 5. Sync to MongoDB
  await syncToMongoIfConnected();
  console.log('✅ In-memory data store initialized with rich multi-city Prime Video catalog!');
};

// Sync initial seed data to MongoDB when connected
const syncToMongoIfConnected = async () => {
  if (!getIsConnected()) return;

  try {
    const User = require('../models/userModel');
    const Admin = require('../models/adminModel');
    const Movie = require('../models/movieModel');
    const Theatre = require('../models/theatreModel');
    const Show = require('../models/showModel');

    // 1. Sync Theatres
    const theatreCount = await Theatre.countDocuments();
    if (theatreCount === 0) {
      console.log('Seeding registered theatres into MongoDB...');
      await Theatre.insertMany(store.theatres, { ordered: false });
    }

    // 2. Sync Movies
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('Seeding initial feature movies into MongoDB...');
      await Movie.insertMany(store.movies, { ordered: false });
    }

    // 3. Sync Shows
    const showCount = await Show.countDocuments();
    if (showCount === 0) {
      console.log('Seeding initial showtimes into MongoDB...');
      await Show.insertMany(store.shows, { ordered: false });
    }

    // 4. Sync Users & Admins
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(store.users, { ordered: false });
    }
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.insertMany(store.admins, { ordered: false });
    }
  } catch (err) {
    console.warn('Notice during MongoDB store sync:', err.message);
  }
};

module.exports = {
  store,
  initStore,
  cleanupExpiredSeatLocks,
  formatDateStr,
  SEAT_LOCK_TTL_MS,
};
