const mongoose = require('mongoose');
require('dotenv').config();

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    throw error;
  }
}

module.exports = connectToMongoDB;
