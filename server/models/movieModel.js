const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: [true, 'Movie name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    duration: {
      type: mongoose.Schema.Types.Mixed, // String (e.g. "2h 45m") or Number (minutes)
      required: [true, 'Duration is required'],
    },
    certification: {
      type: String,
      default: 'U/A 16+',
    },
    posterUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    },
    backdropUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    },
    trailerUrl: {
      type: String,
      default: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    director: {
      type: String,
      default: 'Acclaimed Director',
    },
    cast: {
      type: [String],
      default: ['Lead Actor', 'Supporting Cast'],
    },
    imdbRating: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);
