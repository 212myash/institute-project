const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const attendanceRoutes = require('./routes/attendance');
const studentRoutes = require('./routes/student');

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

// ─── CORS: restrict to configured origins (no more origin: '*') ───
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      // If no origins are configured, allow all origins to avoid blocking deployment checks.
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ─── Global rate limiter (100 req / 15 min per IP) ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// ─── Request logger (development only) ───
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ─── Lazy DB connection middleware (skip health endpoints) ───
app.use(async (req, res, next) => {
  const skipDbPaths = ['/', '/api/health', '/health', '/api/test', '/test'];
  if (skipDbPaths.includes(req.path)) {
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

// ─── Health check endpoints ───
app.get('/', (req, res) => {
  res.status(200).send('API Running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.get('/health', (req, res) => {
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

app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API working',
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth rate limiter (stricter: 20 req / 15 min per IP) ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

// ─── Routes ───
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student', studentRoutes);

// ─── 404 handler ───
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global error handler ───
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Export app for Vercel serverless
module.exports = app;
