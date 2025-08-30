export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    status = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (err.code && err.code.startsWith('SQLITE_')) {
    status = 400;
    message = 'Database error';
    code = 'DATABASE_ERROR';
  } else if (err.message) {
    message = err.message;
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production') {
    if (status === 500) {
      message = 'Internal server error';
    }
  }

  res.status(status).json({
    error: message,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}