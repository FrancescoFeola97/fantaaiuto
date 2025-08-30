export function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';

  // Log request
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);

  // Log response when it finishes
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - req.startTime;
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} (${duration}ms)`);
    originalEnd.apply(this, args);
  };

  req.startTime = Date.now();
  next();
}