import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const user = await db.get(
      'SELECT id, username, email, display_name, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    const settings = await db.get(
      'SELECT total_budget, max_players, roles_config FROM user_settings WHERE user_id = ?',
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      settings: {
        totalBudget: settings?.total_budget || 500,
        maxPlayers: settings?.max_players || 30,
        rolesConfig: JSON.parse(settings?.roles_config || '{}')
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', [
  body('displayName').optional().trim().isLength({ max: 100 }).withMessage('Display name must be less than 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { displayName, email } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Check if email is already used by another user
    if (email) {
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already in use',
          code: 'EMAIL_IN_USE'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (displayName !== undefined) {
      updates.push('display_name = ?');
      values.push(displayName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        code: 'NO_UPDATES'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get user settings
router.get('/settings', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const settings = await db.get(
      'SELECT total_budget, max_players, roles_config FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (!settings) {
      return res.status(404).json({
        error: 'User settings not found',
        code: 'SETTINGS_NOT_FOUND'
      });
    }

    res.json({
      settings: {
        totalBudget: settings.total_budget,
        maxPlayers: settings.max_players,
        rolesConfig: JSON.parse(settings.roles_config || '{}')
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user settings
router.put('/settings', [
  body('totalBudget').optional().isInt({ min: 1, max: 10000 }).withMessage('Total budget must be between 1 and 10000'),
  body('maxPlayers').optional().isInt({ min: 1, max: 100 }).withMessage('Max players must be between 1 and 100'),
  body('rolesConfig').optional().isObject().withMessage('Roles config must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { totalBudget, maxPlayers, rolesConfig } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (totalBudget !== undefined) {
      updates.push('total_budget = ?');
      values.push(totalBudget);
    }
    if (maxPlayers !== undefined) {
      updates.push('max_players = ?');
      values.push(maxPlayers);
    }
    if (rolesConfig !== undefined) {
      updates.push('roles_config = ?');
      values.push(JSON.stringify(rolesConfig));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No settings to update',
        code: 'NO_UPDATES'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await db.run(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    res.json({
      message: 'Settings updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get user statistics and analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // Get basic counts
    const counts = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM user_players WHERE user_id = ? AND status = 'owned') as owned_players,
        (SELECT COUNT(*) FROM user_players WHERE user_id = ? AND interessante = 1) as interesting_players,
        (SELECT COUNT(*) FROM user_players WHERE user_id = ? AND rimosso = 1) as removed_players,
        (SELECT COUNT(*) FROM participants WHERE user_id = ?) as participants_count,
        (SELECT COUNT(*) FROM formations WHERE user_id = ?) as formations_count
    `, [userId, userId, userId, userId, userId]);

    // Get budget usage
    const budgetStats = await db.get(`
      SELECT 
        us.total_budget,
        COALESCE(SUM(up.costo_reale), 0) as budget_used,
        COUNT(up.id) as owned_count
      FROM user_settings us
      LEFT JOIN user_players up ON us.user_id = up.user_id AND up.status = 'owned'
      WHERE us.user_id = ?
      GROUP BY us.user_id
    `, [userId]);

    // Get activity by day (last 30 days)
    const activity = await db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as actions
      FROM audit_log
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId]);

    res.json({
      counts: {
        ownedPlayers: counts.owned_players || 0,
        interestingPlayers: counts.interesting_players || 0,
        removedPlayers: counts.removed_players || 0,
        participantsCount: counts.participants_count || 0,
        formationsCount: counts.formations_count || 0
      },
      budget: {
        totalBudget: budgetStats?.total_budget || 500,
        budgetUsed: budgetStats?.budget_used || 0,
        budgetRemaining: (budgetStats?.total_budget || 500) - (budgetStats?.budget_used || 0),
        ownedCount: budgetStats?.owned_count || 0
      },
      activity: activity.map(a => ({
        date: a.date,
        actions: a.actions
      }))
    });

  } catch (error) {
    next(error);
  }
});

export default router;