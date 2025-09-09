import winston from 'winston';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const logColors = {
  error: 'red',
  warn: 'yellow', 
  info: 'green',
  debug: 'blue'
};

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta
    };
    
    // In development, make it more readable
    if (process.env.NODE_ENV !== 'production') {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? `\n${stack}` : ''} ${Object.keys(meta).length ? `\nMeta: ${JSON.stringify(meta, null, 2)}` : ''}`;
    }
    
    return JSON.stringify(logEntry);
  })
);

// Create winston logger instance
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  defaultMeta: { 
    service: 'fantaaiuto-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs to file in production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : []),
    
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: logColors }),
        winston.format.simple()
      ),
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
    })
  ]
});

// Performance monitoring utilities
const performanceLogger = {
  startTimer: (label) => {
    const start = process.hrtime.bigint();
    return {
      end: (additionalMeta = {}) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        logger.info('Performance metric', {
          metric: label,
          duration: `${duration.toFixed(2)}ms`,
          ...additionalMeta
        });
        
        return duration;
      }
    };
  }
};

// Request logging helper
const requestLogger = (req, res, responseTime, statusCode) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    ...(req.user && { userId: req.user.id }),
    ...(req.leagueId && { leagueId: req.leagueId })
  };

  if (statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Error tracking helper
const errorTracker = {
  captureError: (error, context = {}) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    });
  },
  
  captureException: (error, req = null) => {
    const context = {
      ...(req && {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        ...(req.user && { userId: req.user.id }),
        ...(req.body && { body: req.body }),
        ...(req.query && { query: req.query }),
        ...(req.params && { params: req.params })
      })
    };
    
    logger.error('Unhandled Exception', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    });
  }
};

// Database operation logging
const dbLogger = {
  logConnection: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  logQuery: (query, params, duration) => {
    logger.debug('Database Query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params ? JSON.stringify(params) : null,
      duration: `${duration}ms`
    });
  },
  
  logError: (error, query, params) => {
    logger.error('Database Error', {
      message: error.message,
      code: error.code,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params ? JSON.stringify(params) : null
    });
  }
};

// Authentication logging
const authLogger = {
  loginAttempt: (username, success, ip, userAgent) => {
    logger.info('Login Attempt', {
      username,
      success,
      ip,
      userAgent
    });
  },
  
  registrationAttempt: (username, email, success, ip) => {
    logger.info('Registration Attempt', {
      username,
      email,
      success,
      ip
    });
  },
  
  tokenValidation: (success, reason, userId = null) => {
    logger.info('Token Validation', {
      success,
      reason,
      ...(userId && { userId })
    });
  }
};

// System health logging
const healthLogger = {
  systemStart: () => {
    logger.info('System Starting', {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid
    });
  },
  
  databaseConnection: (success, error = null) => {
    if (success) {
      logger.info('Database Connected Successfully');
    } else {
      logger.error('Database Connection Failed', {
        error: error?.message,
        stack: error?.stack
      });
    }
  },
  
  memoryUsage: () => {
    const usage = process.memoryUsage();
    logger.debug('Memory Usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
    });
  }
};

export {
  logger,
  performanceLogger,
  requestLogger,
  errorTracker,
  dbLogger,
  authLogger,
  healthLogger
};