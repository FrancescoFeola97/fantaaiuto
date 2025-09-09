import { errorTracker, logger } from '../utils/logger.js';

// Global error tracking setup
export const setupErrorTracking = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - Shutting down...', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
  });
  
  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Node.js Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
};

// Express error tracking middleware
export const errorTrackingMiddleware = (err, req, res, next) => {
  // Track the error with full context
  errorTracker.captureException(err, req);
  
  // Continue with the existing error handler
  next(err);
};

// API endpoint error wrapper
export const withErrorTracking = (asyncFn) => {
  return async (req, res, next) => {
    try {
      await asyncFn(req, res, next);
    } catch (error) {
      // Capture error with request context
      errorTracker.captureException(error, req);
      next(error);
    }
  };
};

// Database error tracking
export const trackDatabaseError = (error, query, params, context = {}) => {
  errorTracker.captureError(error, {
    type: 'database_error',
    query: query?.substring(0, 200) + (query?.length > 200 ? '...' : ''),
    params: params ? JSON.stringify(params) : null,
    ...context
  });
};

// Authentication error tracking
export const trackAuthError = (error, context = {}) => {
  errorTracker.captureError(error, {
    type: 'authentication_error',
    ...context
  });
};

// Validation error tracking
export const trackValidationError = (errors, req) => {
  errorTracker.captureError(new Error('Validation failed'), {
    type: 'validation_error',
    validationErrors: errors,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params
  });
};