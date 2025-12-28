const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

// ============ ENVIRONMENT VALIDATION ============
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET']
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error(
    '❌ Missing required environment variables:',
    missingEnvVars.join(', ')
  )
  console.error('Please check your .env file')
  process.exit(1)
}

// Warn about insecure JWT secret in production
if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_SECRET ===
    'your-super-secret-jwt-key-change-this-in-production'
) {
  console.error('❌ SECURITY WARNING: Using default JWT secret in production!')
  process.exit(1)
}

// ============ ROUTE IMPORTS ============
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const categoryRoutes = require('./routes/categories')
const templateRoutes = require('./routes/templates')
const analyticsRoutes = require('./routes/analytics')
const settingsRoutes = require('./routes/settings')
const reportsRoutes = require('./routes/reports')
const goalsRoutes = require('./routes/goals')

const app = express()

// ============ SECURITY MIDDLEWARE ============
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
]

// Add production frontend URL if configured
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true)

      // Check if origin is in allowed list
      if (
        allowedOrigins.some((allowed) =>
          origin.startsWith(allowed.replace(/:\d+$/, ''))
        )
      ) {
        return callback(null, true)
      }

      // In development, allow localhost on any port
      if (
        process.env.NODE_ENV !== 'production' &&
        (origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true)
      }

      // In production, be strict
      if (process.env.NODE_ENV === 'production') {
        console.warn(`CORS blocked origin: ${origin}`)
        return callback(new Error('Not allowed by CORS'), false)
      }

      // Default allow in development
      callback(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body parser
app.use(express.json({ limit: '10mb' }))

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })
}

// ============ ROUTES ============
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/goals', goalsRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Student Todo API',
    version: '1.0.0',
    health: '/api/health',
  })
})

// ============ ERROR HANDLING ============
// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.message)

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production'

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ============ DATABASE & SERVER STARTUP ============
const PORT = process.env.PORT || 5000

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  try {
    await mongoose.connection.close()
    console.log('MongoDB connection closed.')
    process.exit(0)
  } catch (err) {
    console.error('Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  })

module.exports = app
