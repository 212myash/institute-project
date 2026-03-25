const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const attendanceRoutes = require('./routes/attendance');

// Initialize Express app
const app = express();

let dbReadyPromise = null;

function ensureDbConnection() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      console.error('DB connection failed:', error.message);
      dbReadyPromise = null;
      throw error;
    });
  }

  return dbReadyPromise;
}

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Basic request logger for debugging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health' || req.path === '/api/test') {
    return next();
  }

  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('API Running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API working',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/courses', courseRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);

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
