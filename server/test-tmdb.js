const dotenv = require('dotenv');
dotenv.config();

const {
  getNowPlayingMovies,
  getPopularMovies,
  getLiveMarketCatalog,
  getMovieDetails,
  searchMovies,
} = require('./services/tmdbService');

const testTMDB = async () => {
  console.log('Testing TMDB API Service with key:', process.env.TMDB_API_KEY);

  const nowPlaying = await getNowPlayingMovies(1);
  console.log(`✓ Fetched Now Playing: ${nowPlaying.length} movies.`);
  if (nowPlaying.length > 0) {
    console.log(`  Sample 1: "${nowPlaying[0].title}" (ID: ${nowPlaying[0].id})`);
  }

  const catalog = await getLiveMarketCatalog();
  console.log(`✓ Live Market Catalog generated: ${catalog ? catalog.length : 0} movies.`);

  if (catalog && catalog.length > 0) {
    const firstMovie = catalog[0];
    console.log(`  Formatted Sample: "${firstMovie.movieName}" | Rating: ${firstMovie.imdbRating} | Language: ${firstMovie.language} | Poster: ${firstMovie.posterUrl.substring(0, 45)}...`);

    const details = await getMovieDetails(firstMovie._id);
    console.log(`✓ Movie Details & Credits for "${details?.movieName}":`);
    console.log(`  Director: ${details?.director} | Duration: ${details?.duration} | Cast: ${details?.cast?.join(', ')} | Trailer: ${details?.trailerUrl}`);
  }

  const searchResults = await searchMovies('Avatar');
  console.log(`✓ Search Movies for "Avatar": found ${searchResults.length} results.`);

  console.log('\n--- TMDB SERVICE TEST COMPLETED SUCCESSFULLY! ---\n');
};

testTMDB().catch((err) => {
  console.error('TMDB Test Failed:', err);
  process.exit(1);
});
