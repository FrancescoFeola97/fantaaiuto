import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import playersRoutes from './routes/players.js';
import participantsRoutes from './routes/participants.js';
import formationsRoutes from './routes/formations.js';
import userRoutes from './routes/users.js';
import leaguesRoutes from './routes/leagues.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { logger as structuredLogger, healthLogger } from './utils/logger.js';
import { performanceMonitoring, memoryMonitor } from './middleware/performance.js';
import { setupErrorTracking, errorTrackingMiddleware } from './middleware/errorTracking.js';

// Import database initialization
import { initializeDatabase } from './database/postgres-init.js';

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
// Also try to load production env if it exists
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
}

// Validate critical environment variables
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    structuredLogger.error('FATAL: Missing required environment variables', {
      component: 'server-startup',
      missingVars,
      requiredVars,
      environment: process.env.NODE_ENV || 'development'
    });
    missingVars.forEach(varName => {
      structuredLogger.error('Missing environment variable', {
        variable: varName,
        example: varName === 'JWT_SECRET' ? 'your-secure-random-secret' : 'your-value'
      });
    });
    process.exit(1);
  }
}

validateEnvironment();

// Setup error tracking
setupErrorTracking();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:8084',
  'http://localhost:8085', 
  'http://localhost:8086',
  'https://fantaiuto.netlify.app', // Single 'a' version
  'https://fantaaiuto.netlify.app', // Double 'a' version
  'https://fantaaiuto-v2.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-league-id'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Rate limiting for auth endpoints - more reasonable limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (much more reasonable)
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logger);

// Performance monitoring middleware
app.use(performanceMonitoring);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/leagues', authenticateToken, leaguesRoutes);
app.use('/api/players', authenticateToken, playersRoutes);
app.use('/api/participants', authenticateToken, participantsRoutes);
app.use('/api/formations', authenticateToken, formationsRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error tracking middleware (before error handler)
app.use(errorTrackingMiddleware);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Log system startup
    healthLogger.systemStart();
    
    structuredLogger.info('🔄 Initializing PostgreSQL database...');
    await initializeDatabase();
    healthLogger.databaseConnection(true);
    structuredLogger.info('✅ PostgreSQL database initialized successfully');

    app.listen(PORT, () => {
      structuredLogger.info('🚀 FantaAiuto Backend Server Started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiUrl: `http://localhost:${PORT}/api`,
        healthUrl: `http://localhost:${PORT}/health`,
        corsOrigins: allowedOrigins
      });
      
      // Start memory monitoring (every 5 minutes)
      setInterval(() => {
        memoryMonitor();
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    structuredLogger.error('❌ Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    healthLogger.databaseConnection(false, error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  structuredLogger.info('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  structuredLogger.info('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server - Deploy test for persistence check
startServer();

export default app;