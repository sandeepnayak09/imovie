const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    city: {
      type: String,
      default: 'National',
      trim: true,
    },
    balconySeatPrice: {
      type: Number,
      required: [true, 'Balcony seat price is required'],
      min: 0,
    },
    middleSeatPrice: {
      type: Number,
      required: [true, 'Middle seat price is required'],
      min: 0,
    },
    lowerSeatPrice: {
      type: Number,
      required: [true, 'Lower seat price is required'],
      min: 0,
    },
    balconySeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Balcony seats layout is required'],
    },
    middleSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Middle seats layout is required'],
    },
    lowerSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Lower seats layout is required'],
    },
    facilities: {
      type: [String],
      default: ['Dolby Atmos 7.1', '4K Laser Projection', 'Recliner Seating', 'In-Seat Dining'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Theatre', theatreSchema);
