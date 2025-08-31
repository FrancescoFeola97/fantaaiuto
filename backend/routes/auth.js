import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Display name must be less than 100 characters')
];

const validateLogin = [
  body('username').notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required')
];

// Register new user
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, displayName } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, display_name) 
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, displayName || username]
    );

    const userId = result.lastID;

    // Create default user settings
    await db.run(
      `INSERT INTO user_settings (user_id, total_budget, max_players, roles_config)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        500, // default budget
        30,  // default max players
        JSON.stringify({
          Por: 3, Ds: 2, Dd: 2, Dc: 2, B: 2, E: 2, M: 2, C: 2, W: 2, T: 2, A: 2, Pc: 2
        })
      ]
    );

    // Generate token
    const token = generateToken(userId, username);

    // Log registration
    console.log(`✅ New user registered: ${username} (ID: ${userId})`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        username,
        email,
        displayName: displayName || username
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;
    const db = getDatabase();

    // Find user
    const user = await db.get(
      'SELECT id, username, email, password_hash, display_name, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.username);

    // Log login
    console.log(`🔐 User logged in: ${user.username} (ID: ${user.id})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

// Verify token (for frontend to check if token is still valid)
router.post('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify token manually
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
    
    try {
      const decoded = jwt.default.verify(token, JWT_SECRET);
      const db = getDatabase();
      
      // Get user data
      const user = await db.get(
        'SELECT id, username, email, display_name, is_active FROM users WHERE id = ? AND is_active = ?',
        [decoded.userId, true]
      );

      if (!user) {
        return res.status(403).json({
          error: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      res.json({
        valid: true,
        message: 'Token is valid',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name
        }
      });
    } catch (jwtError) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password required',
        code: 'PASSWORDS_REQUIRED'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // This would need authentication middleware, but for now we'll skip it
    // In a full implementation, you'd get the user ID from req.user
    
    res.json({
      message: 'Password change endpoint - requires authentication middleware'
    });

  } catch (error) {
    next(error);
  }
});

export default router;