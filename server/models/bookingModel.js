const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      trim: true,
    },
    selectedSeats: {
      type: [String],
      required: [true, 'Selected seats are required'],
    },
    seatDetails: [
      {
        seatId: String,
        tier: String,
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      default: 'Credit/Debit Card',
    },
    transactionId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    movieName: {
      type: String,
    },
    moviePoster: {
      type: String,
    },
    theatreName: {
      type: String,
    },
    theatreLocation: {
      type: String,
    },
    showDate: {
      type: Date,
    },
    showTime: {
      type: String,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
