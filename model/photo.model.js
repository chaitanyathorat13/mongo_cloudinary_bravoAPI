const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  userId: {
    type:Number,
    ref: 'User',
    required: true
  },
  path: {
    type: String,
    required: true
  },
  cloudinary_id: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Photo', photoSchema);
