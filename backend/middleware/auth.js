import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/postgres-init.js';
import { logger, authLogger, errorTracker } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is required for security', {
    component: 'auth-middleware',
    required_env_var: 'JWT_SECRET'
  });
  process.exit(1);
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    try {
      // Verify user still exists and is active
      const db = getDatabase();
      const user = await db.get(
        'SELECT id, username, email, display_name, is_active FROM users WHERE id = $1 AND is_active = $2',
        [decoded.userId, true]
      );

      if (!user) {
        return res.status(403).json({ 
          error: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Add user info to request
      req.user = user;
      next();
    } catch (error) {
      errorTracker.captureError(error, {
        component: 'auth-middleware',
        action: 'token-verification',
        userId: decoded?.userId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      return res.status(500).json({ 
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  });
}

export function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: process.env.SESSION_TIMEOUT || '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Optional: Role-based access control
export function requireRole(role) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // For now, we don't have roles in the schema, but this can be extended
    // const userRole = await getUserRole(req.user.id);
    // if (userRole !== role) {
    //   return res.status(403).json({ 
    //     error: 'Insufficient permissions',
    //     code: 'INSUFFICIENT_PERMISSIONS'
    //   });
    // }

    next();
  };
}