const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

let isConnected = false;

mongoose.connection.on('connected', () => {
  console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Error:', err.message);
});

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    const error = new Error(
      'MONGO_URI environment variable is not set. Add MONGO_URI in backend/.env or Vercel Environment Variables.'
    );
    console.error('Connection failed:', error.message);
    throw error;
  }

  try {
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGO_URI format. It must start with mongodb:// or mongodb+srv://');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    console.error('Connection failed:', error.message);
    isConnected = false;
    throw error;
  }
};

module.exports = connectDB;
