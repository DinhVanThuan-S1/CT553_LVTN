/**
 * Server Entry Point
 * Khởi tạo Express server, middleware và routes
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');

const env = require('./config/env');
const connectDB = require('./config/db');

// Khởi tạo Express app
const app = express();
const httpServer = createServer(app);

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// HTTP request logger (development only)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'EduPath API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ===== PASSPORT =====
const passport = require('./config/passport');
app.use(passport.initialize());

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/skills', require('./routes/skill.routes'));
app.use('/api/curriculum-programs', require('./routes/curriculum.routes'));
app.use('/api/roadmaps', require('./routes/roadmap.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/employer', require('./routes/employer.routes'));

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ===== START SERVER =====
const startServer = async () => {
  // Kết nối MongoDB
  await connectDB();

  // Khởi động server
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 EduPath API Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 Health check: http://localhost:${env.PORT}/api/health`);
  });
};

startServer();

module.exports = { app, httpServer };
