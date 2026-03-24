const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Connect to database
app.use(async (req, res, next) => {
  try {
    // Only connect if not already connected
    if (!global.dbConnected) {
      await connectDB();
      global.dbConnected = true;
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    // Continue even if DB connection fails (useful for Vercel serverless)
    next();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Export app for Vercel serverless
module.exports = app;
