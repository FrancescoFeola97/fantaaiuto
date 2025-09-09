import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';
import { uploadFormationImage, handleUploadError } from '../middleware/upload.js';
import { errorTracker } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Middleware to validate league access
const validateLeagueAccess = async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.headers['x-league-id'];
    
    if (!leagueId) {
      return res.status(400).json({
        error: 'League ID required',
        message: 'Please select a league first'
      });
    }
    
    // Check if user is member of this league
    const membership = await db.get(
      'SELECT league_id, role FROM league_members WHERE league_id = $1 AND user_id = $2',
      [leagueId, userId]
    );
    
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this league'
      });
    }
    
    req.leagueId = leagueId;
    req.leagueRole = membership.role;
    next();
    
  } catch (error) {
    errorTracker.captureError(error, {
      component: 'formations-route',
      action: 'league-validation',
      userId: req.user?.id,
      leagueId: req.headers['x-league-id']
    });
    res.status(500).json({
      error: 'League validation failed',
      message: error.message
    });
  }
};

// Apply league validation to all routes
router.use(validateLeagueAccess);

// Get all formations for the authenticated user in current league
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.leagueId;

    const formations = await db.all(
      'SELECT id, name, schema, players, is_active, created_at, updated_at FROM league_formations WHERE user_id = $1 AND league_id = $2 ORDER BY created_at DESC',
      [userId, leagueId]
    );

    res.json({
      formations: formations.map(f => ({
        id: f.id,
        name: f.name,
        schema: f.schema,
        players: JSON.parse(f.players || '[]'),
        isActive: Boolean(f.is_active),
        createdAt: f.created_at,
        updatedAt: f.updated_at
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Create new formation
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Formation name is required and must be less than 100 characters'),
  body('schema').matches(/^\d-\d-\d$/).withMessage('Schema must be in format X-X-X (e.g., 4-3-3)'),
  body('players').optional().isArray().withMessage('Players must be an array')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, schema, players = [] } = req.body;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Create formation in league
    const result = await db.get(
      'INSERT INTO league_formations (user_id, league_id, name, schema, players) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, leagueId, name, schema, JSON.stringify(players)]
    );

    const formation = {
      id: result.id,
      name,
      schema,
      players,
      isActive: false
    };

    console.log(`⚽ New formation created: ${name} (${schema})`);

    res.status(201).json({
      message: 'Formation created successfully',
      formation
    });

  } catch (error) {
    next(error);
  }
});

// Update formation
router.put('/:formationId', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Formation name must be less than 100 characters'),
  body('schema').optional().matches(/^\d-\d-\d$/).withMessage('Schema must be in format X-X-X (e.g., 4-3-3)'),
  body('players').optional().isArray().withMessage('Players must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { formationId } = req.params;
    const { name, schema, players, isActive } = req.body;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify formation exists and belongs to user in this league
    const formation = await db.get(
      'SELECT id FROM league_formations WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [formationId, userId, leagueId]
    );

    if (!formation) {
      return res.status(404).json({
        error: 'Formation not found in this league',
        code: 'FORMATION_NOT_FOUND'
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (schema !== undefined) {
      updates.push(`schema = $${++paramCount}`);
      values.push(schema);
    }
    if (players !== undefined) {
      updates.push(`players = $${++paramCount}`);
      values.push(JSON.stringify(players));
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${++paramCount}`);
      values.push(isActive ? 1 : 0);
      
      // If setting this formation as active, deactivate others in this league
      if (isActive) {
        await db.run('UPDATE league_formations SET is_active = 0 WHERE user_id = $1 AND league_id = $2 AND id != $3', [userId, leagueId, formationId]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        code: 'NO_UPDATES'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(formationId);

    await db.run(
      `UPDATE league_formations SET ${updates.join(', ')} WHERE id = $${++paramCount}`,
      values
    );

    res.json({
      message: 'Formation updated successfully',
      formationId: parseInt(formationId)
    });

  } catch (error) {
    next(error);
  }
});

// Delete formation
router.delete('/:formationId', async (req, res, next) => {
  try {
    const { formationId } = req.params;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify formation exists and belongs to user in this league
    const formation = await db.get(
      'SELECT id, name FROM league_formations WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [formationId, userId, leagueId]
    );

    if (!formation) {
      return res.status(404).json({
        error: 'Formation not found in this league',
        code: 'FORMATION_NOT_FOUND'
      });
    }

    // Delete formation
    await db.run('DELETE FROM league_formations WHERE id = $1', [formationId]);

    console.log(`⚽ Formation deleted: ${formation.name}`);

    res.json({
      message: 'Formation deleted successfully',
      formationId: parseInt(formationId)
    });

  } catch (error) {
    next(error);
  }
});

// Get formation images for the authenticated user
router.get('/images', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const images = await db.all(
      'SELECT id, filename, original_name, file_size, mime_type, created_at FROM formation_images WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        originalName: img.original_name,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        createdAt: img.created_at,
        url: `/uploads/formations/${img.filename}`
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Upload formation image
router.post('/images', async (req, res, next) => {
  try {
    // This would typically use multer middleware for file upload
    // For now, return a placeholder response
    res.status(501).json({
      message: 'File upload not implemented in this version',
      code: 'NOT_IMPLEMENTED'
    });

  } catch (error) {
    next(error);
  }
});

// Delete formation image
router.delete('/images/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify image exists and belongs to user
    const image = await db.get(
      'SELECT id, filename FROM formation_images WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    if (!image) {
      return res.status(404).json({
        error: 'Image not found',
        code: 'IMAGE_NOT_FOUND'
      });
    }

    // Delete from database
    await db.run('DELETE FROM formation_images WHERE id = ?', [imageId]);

    // TODO: Delete physical file from filesystem

    res.json({
      message: 'Image deleted successfully',
      imageId: parseInt(imageId)
    });

  } catch (error) {
    next(error);
  }
});

export default router;