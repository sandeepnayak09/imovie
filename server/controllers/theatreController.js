const { getIsConnected } = require('../config/db');
const { store } = require('../data/store');
const Theatre = require('../models/theatreModel');

// @desc    Get all theatres
// @route   GET /api/theatre
const getTheatres = async (req, res) => {
  try {
    if (getIsConnected()) {
      const theatres = await Theatre.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: theatres.length, theatres });
    } else {
      return res.json({ success: true, count: store.theatres.length, theatres: store.theatres });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching theatres.' });
  }
};

// @desc    Get theatre by ID
// @route   GET /api/theatre/:id
const getTheatreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const theatre = await Theatre.findById(id);
      if (!theatre) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      return res.json({ success: true, theatre });
    } else {
      const theatre = store.theatres.find((t) => t._id === id || t.id === id);
      if (!theatre) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      return res.json({ success: true, theatre });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// @desc    Add a new theatre
// @route   POST /api/theatre
const addTheatre = async (req, res) => {
  try {
    const {
      theatreName,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
      facilities,
    } = req.body;

    if (
      !theatreName ||
      !location ||
      balconySeatPrice === undefined ||
      middleSeatPrice === undefined ||
      lowerSeatPrice === undefined ||
      !balconySeats ||
      !middleSeats ||
      !lowerSeats
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide theatreName, location, tier seat prices, and seat layouts.',
      });
    }

    const theatreData = {
      theatreName: theatreName.trim(),
      location: location.trim(),
      balconySeatPrice: Number(balconySeatPrice),
      middleSeatPrice: Number(middleSeatPrice),
      lowerSeatPrice: Number(lowerSeatPrice),
      balconySeats: typeof balconySeats === 'string' ? JSON.parse(balconySeats) : balconySeats,
      middleSeats: typeof middleSeats === 'string' ? JSON.parse(middleSeats) : middleSeats,
      lowerSeats: typeof lowerSeats === 'string' ? JSON.parse(lowerSeats) : lowerSeats,
      facilities: Array.isArray(facilities)
        ? facilities
        : facilities
        ? String(facilities).split(',').map((f) => f.trim())
        : ['Dolby Atmos', '4K Projection', 'Recliner Seating'],
    };

    if (getIsConnected()) {
      const newTheatre = await Theatre.create(theatreData);
      return res.status(201).json({ success: true, message: 'Theatre registered successfully!', theatre: newTheatre });
    } else {
      const newTheatre = {
        _id: `th_${Date.now()}`,
        ...theatreData,
        createdAt: new Date(),
      };
      store.theatres.unshift(newTheatre);
      return res.status(201).json({ success: true, message: 'Theatre registered successfully!', theatre: newTheatre });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error adding theatre.' });
  }
};

// @desc    Update theatre details
// @route   PUT /api/theatre/:id
const updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const updatedTheatre = await Theatre.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedTheatre) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      return res.json({ success: true, message: 'Theatre updated successfully!', theatre: updatedTheatre });
    } else {
      const index = store.theatres.findIndex((t) => t._id === id || t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      store.theatres[index] = { ...store.theatres[index], ...req.body, updatedAt: new Date() };
      return res.json({ success: true, message: 'Theatre updated successfully!', theatre: store.theatres[index] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating theatre.' });
  }
};

// @desc    Delete theatre
// @route   DELETE /api/theatre/:id
const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const theatre = await Theatre.findByIdAndDelete(id);
      if (!theatre) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      return res.json({ success: true, message: 'Theatre deleted successfully.' });
    } else {
      const index = store.theatres.findIndex((t) => t._id === id || t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Theatre not found.' });
      }
      store.theatres.splice(index, 1);
      return res.json({ success: true, message: 'Theatre deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting theatre.' });
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre,
};
