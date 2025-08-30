import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all participants for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const participants = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.budget_used,
        p.players_count,
        p.created_at,
        p.updated_at,
        COUNT(pp.id) as actual_players_count,
        COALESCE(SUM(pp.costo_altri), 0) as actual_budget_used
      FROM participants p
      LEFT JOIN participant_players pp ON p.id = pp.participant_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.name
    `, [userId]);

    res.json({
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        budgetUsed: p.actual_budget_used,
        playersCount: p.actual_players_count,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Create new participant
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Participant name is required and must be less than 100 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Check if participant already exists for this user
    const existing = await db.get(
      'SELECT id FROM participants WHERE user_id = ? AND name = ?',
      [userId, name]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Participant with this name already exists',
        code: 'PARTICIPANT_EXISTS'
      });
    }

    // Create participant
    const result = await db.run(
      'INSERT INTO participants (user_id, name) VALUES (?, ?)',
      [userId, name]
    );

    const participant = {
      id: result.lastID,
      name,
      budgetUsed: 0,
      playersCount: 0
    };

    console.log(`👥 New participant created: ${name} (ID: ${result.lastID}) for user ${userId}`);

    res.status(201).json({
      message: 'Participant created successfully',
      participant
    });

  } catch (error) {
    next(error);
  }
});

// Update participant
router.put('/:participantId', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Participant name is required and must be less than 100 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { participantId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify participant exists and belongs to user
    const participant = await db.get(
      'SELECT id FROM participants WHERE id = ? AND user_id = ?',
      [participantId, userId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Check if name conflicts with another participant
    const existing = await db.get(
      'SELECT id FROM participants WHERE user_id = ? AND name = ? AND id != ?',
      [userId, name, participantId]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Participant with this name already exists',
        code: 'PARTICIPANT_EXISTS'
      });
    }

    // Update participant
    await db.run(
      'UPDATE participants SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, participantId]
    );

    res.json({
      message: 'Participant updated successfully',
      participant: {
        id: parseInt(participantId),
        name
      }
    });

  } catch (error) {
    next(error);
  }
});

// Delete participant
router.delete('/:participantId', async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify participant exists and belongs to user
    const participant = await db.get(
      'SELECT id, name FROM participants WHERE id = ? AND user_id = ?',
      [participantId, userId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Delete participant (CASCADE will delete related player assignments)
    await db.run('DELETE FROM participants WHERE id = ?', [participantId]);

    console.log(`👥 Participant deleted: ${participant.name} (ID: ${participantId}) for user ${userId}`);

    res.json({
      message: 'Participant deleted successfully',
      participantId: parseInt(participantId)
    });

  } catch (error) {
    next(error);
  }
});

// Get players owned by a participant
router.get('/:participantId/players', async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify participant belongs to user
    const participant = await db.get(
      'SELECT id, name FROM participants WHERE id = ? AND user_id = ?',
      [participantId, userId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    const players = await db.all(`
      SELECT 
        pp.id as assignment_id,
        mp.id as player_id,
        mp.nome,
        mp.squadra,
        mp.ruolo,
        mp.prezzo,
        mp.fvm,
        pp.costo_altri,
        pp.data_acquisto,
        pp.created_at
      FROM participant_players pp
      JOIN master_players mp ON pp.master_player_id = mp.id
      WHERE pp.participant_id = ? AND pp.user_id = ?
      ORDER BY mp.ruolo, mp.nome
    `, [participantId, userId]);

    res.json({
      participant: {
        id: participant.id,
        name: participant.name
      },
      players: players.map(p => ({
        assignmentId: p.assignment_id,
        playerId: p.player_id,
        nome: p.nome,
        squadra: p.squadra,
        ruolo: p.ruolo,
        prezzo: p.prezzo,
        fvm: p.fvm,
        costoAltri: p.costo_altri,
        dataAcquisto: p.data_acquisto,
        createdAt: p.created_at
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Assign player to participant
router.post('/:participantId/players/:playerId', [
  body('costoAltri').optional().isNumeric().withMessage('Cost must be numeric')
], async (req, res, next) => {
  try {
    const { participantId, playerId } = req.params;
    const { costoAltri = 0 } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify participant belongs to user
    const participant = await db.get(
      'SELECT id FROM participants WHERE id = ? AND user_id = ?',
      [participantId, userId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Verify player exists
    const player = await db.get('SELECT id, nome FROM master_players WHERE id = ?', [playerId]);
    if (!player) {
      return res.status(404).json({
        error: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
    }

    // Check if player is already assigned to this participant
    const existing = await db.get(
      'SELECT id FROM participant_players WHERE participant_id = ? AND master_player_id = ? AND user_id = ?',
      [participantId, playerId, userId]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Player already assigned to this participant',
        code: 'PLAYER_ALREADY_ASSIGNED'
      });
    }

    // Assign player to participant
    const result = await db.run(
      'INSERT INTO participant_players (user_id, participant_id, master_player_id, costo_altri, data_acquisto) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [userId, participantId, playerId, costoAltri]
    );

    res.status(201).json({
      message: 'Player assigned to participant successfully',
      assignmentId: result.lastID,
      playerId: parseInt(playerId),
      participantId: parseInt(participantId),
      costoAltri
    });

  } catch (error) {
    next(error);
  }
});

// Remove player from participant
router.delete('/:participantId/players/:playerId', async (req, res, next) => {
  try {
    const { participantId, playerId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify participant belongs to user
    const participant = await db.get(
      'SELECT id FROM participants WHERE id = ? AND user_id = ?',
      [participantId, userId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Find and delete assignment
    const assignment = await db.get(
      'SELECT id FROM participant_players WHERE participant_id = ? AND master_player_id = ? AND user_id = ?',
      [participantId, playerId, userId]
    );

    if (!assignment) {
      return res.status(404).json({
        error: 'Player assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND'
      });
    }

    await db.run('DELETE FROM participant_players WHERE id = ?', [assignment.id]);

    res.json({
      message: 'Player removed from participant successfully',
      playerId: parseInt(playerId),
      participantId: parseInt(participantId)
    });

  } catch (error) {
    next(error);
  }
});

export default router;