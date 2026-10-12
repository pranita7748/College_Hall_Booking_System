const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const clubRoutes = require('./routes/clubRoutes');
const hallRoutes = require('./routes/hallRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Middlewares
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in local dev, but with proper header handling
  },
  credentials: true
}));
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jvn_hall_booking';
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('✓ Successfully connected to MongoDB.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
};

// Database connection middleware for serverless / standard environments
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed. Please check MONGODB_URI configuration.'
      });
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'HallBook - College Reservations',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/hall', hallRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.name || 'Error', err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error'
    });
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field '${err.path}': ${err.value}`
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload in request body.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module || (!process.env.VERCEL && process.env.NODE_ENV !== 'production')) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`✓ JVN Hall Booking Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
    });
}

module.exports = app;
