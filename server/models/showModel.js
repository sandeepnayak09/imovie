const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      unique: true,
      trim: true,
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      trim: true,
      index: true,
    },
    movieName: {
      type: String,
      trim: true,
    },
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    theatreLocation: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      default: 'National',
      trim: true,
    },
    screenFormat: {
      type: String,
      default: 'IMAX 4K Laser',
    },
    showDate: {
      type: Date,
      required: [true, 'Show date is required'],
      index: true,
    },
    showDateString: {
      type: String,
      trim: true,
      index: true,
    },
    showTime: {
      type: String,
      required: [true, 'Show time is required'],
      trim: true,
    },
    tickets: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Tickets map is required'],
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for ultra-fast query matching
showSchema.index({ movieId: 1, showDateString: 1 });
showSchema.index({ movieId: 1, city: 1 });

module.exports = mongoose.model('Show', showSchema);
