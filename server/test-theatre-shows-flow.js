const axios = require('axios');

async function testShowsFlow() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('🧪 Testing Movie Shows, Theatres, City Filter & Booking Flow...\n');

  try {
    // 1. Fetch movies to find "Buddy" or current popular market movies
    console.log('1. Fetching live movies from /api/movie...');
    const moviesRes = await axios.get(`${baseUrl}/movie`);
    const movies = moviesRes.data.movies || [];
    console.log(`Found ${movies.length} movies in catalog.`);

    // Find "Buddy" or use first movie
    let testMovie = movies.find((m) => m.movieName && m.movieName.toLowerCase().includes('buddy'));
    if (!testMovie) {
      testMovie = movies[0];
    }
    console.log(`Selected Test Movie: "${testMovie.movieName}" (ID: ${testMovie._id})`);

    // 2. Test next 4 calendar dates
    const today = new Date();
    const testDates = [0, 1, 2, 3].map((offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return {
        label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : `Day +${offset}`,
        dateStr: `${year}-${month}-${day}`,
      };
    });

    console.log('\n2. Testing Shows Availability Across All 4 Dates:');
    let firstShowId = null;

    for (const { label, dateStr } of testDates) {
      const res = await axios.get(`${baseUrl}/shows/movie/${testMovie._id}?date=${dateStr}&city=All`);
      const shows = res.data.shows || [];
      console.log(`  📅 [${label} - ${dateStr}]: ${shows.length} shows found across ${new Set(shows.map(s => s.theatreName)).size} theatres.`);
      if (shows.length === 0) {
        throw new Error(`Failed: 0 shows found for ${label} (${dateStr})`);
      }
      if (!firstShowId && shows.length > 0) {
        firstShowId = shows[0].showId || shows[0]._id;
      }
    }

    // 3. Test City Filtering
    console.log('\n3. Testing City Selection & Filtering:');
    const citiesToTest = ['New Delhi', 'Mumbai', 'Bengaluru'];
    for (const city of citiesToTest) {
      const cityRes = await axios.get(
        `${baseUrl}/shows/movie/${testMovie._id}?date=${testDates[0].dateStr}&city=${encodeURIComponent(city)}`
      );
      const cityShows = cityRes.data.shows || [];
      console.log(`  🏙️ [City: ${city}]: ${cityShows.length} shows found.`);
      cityShows.forEach((s) => {
        console.log(`     - ${s.theatreName} (${s.theatreLocation}): ${s.showTime} [${s.screenFormat}]`);
      });
      if (cityShows.length === 0) {
        throw new Error(`Failed: 0 shows for city ${city}`);
      }
    }

    // 4. Test Single Show Details & Seat Availability
    console.log(`\n4. Testing Seat Map for Show: ${firstShowId}...`);
    const showRes = await axios.get(`${baseUrl}/shows/${firstShowId}`);
    const show = showRes.data.show;
    const ticketKeys = Object.keys(show.tickets || {});
    console.log(`  🎟️ Total Seats in Auditorium: ${ticketKeys.length}`);
    const availableCount = Object.values(show.tickets).filter((t) => t.status === 'available').length;
    console.log(`  🟢 Available Seats: ${availableCount}`);
    if (ticketKeys.length === 0) {
      throw new Error('Show has empty seat map!');
    }

    // 5. Test Seat Locking API
    console.log('\n5. Testing Real-Time Seat Locking...');
    const testSeat = Object.values(show.tickets).find((t) => t.status === 'available');
    if (!testSeat) throw new Error('No available seat to test lock');

    const lockRes = await axios.post(`${baseUrl}/bookings/lock-seats`, {
      showId: firstShowId,
      selectedSeats: [testSeat.seatId],
      userEmail: 'user@imovies.com',
    });

    console.log('  🔒 Lock Result:', lockRes.data.message, `Expires in ${lockRes.data.ttlSeconds}s`);

    // 6. Test Unlocking
    await axios.post(`${baseUrl}/bookings/unlock-seats`, {
      showId: firstShowId,
      selectedSeats: [testSeat.seatId],
      userEmail: 'user@imovies.com',
    });
    console.log('  🔓 Seat successfully released back to available.');

    console.log('\n======================================================');
    console.log('🎉 ALL THEATRES, SHOWS, DATES & BOOKING CHECKS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test Flow Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testShowsFlow();
