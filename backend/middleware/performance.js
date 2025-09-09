import { performanceLogger, requestLogger } from '../utils/logger.js';

// Request performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const timer = performanceLogger.startTimer(`${req.method} ${req.path}`);
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log request performance
    requestLogger(req, res, responseTime, res.statusCode);
    
    // Log slow requests as warnings
    if (responseTime > 1000) {
      performanceLogger.startTimer('Slow Request').end({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        warning: 'Request took longer than 1 second'
      });
    }
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Memory monitoring (call periodically)
export const memoryMonitor = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(usage.rss / 1024 / 1024);
  
  // Log memory stats
  performanceLogger.startTimer('Memory Check').end({
    heapUsed: `${heapUsedMB}MB`,
    heapTotal: `${heapTotalMB}MB`, 
    rss: `${rssMB}MB`,
    heapUsage: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`
  });
  
  // Warn if memory usage is high
  if (heapUsedMB > 100) {
    performanceLogger.startTimer('High Memory Usage').end({
      heapUsed: `${heapUsedMB}MB`,
      warning: 'Heap usage exceeds 100MB'
    });
  }
};

// Database query performance wrapper
export const monitorDbQuery = async (queryFn, queryDescription) => {
  const timer = performanceLogger.startTimer(`DB: ${queryDescription}`);
  
  try {
    const result = await queryFn();
    const duration = timer.end({
      query: queryDescription,
      success: true
    });
    
    // Warn about slow queries
    if (duration > 500) {
      performanceLogger.startTimer('Slow Database Query').end({
        query: queryDescription,
        duration: `${duration.toFixed(2)}ms`,
        warning: 'Query took longer than 500ms'
      });
    }
    
    return result;
  } catch (error) {
    timer.end({
      query: queryDescription,
      success: false,
      error: error.message
    });
    throw error;
  }
};