import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';
import { errorTracker } from '../utils/logger.js';

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
    
    // Debug logging for membership issues
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Participants - League validation - User: ${userId}, League: ${leagueId}, Membership:`, membership);
    }
    
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this league',
        debug: process.env.NODE_ENV !== 'production' ? { userId, leagueId } : undefined
      });
    }
    
    req.leagueId = leagueId;
    req.leagueRole = membership.role;
    next();
    
  } catch (error) {
    errorTracker.captureError(error, {
      component: 'participants-route',
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

// Get all participants for the authenticated user in current league
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.leagueId;

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
      FROM league_participants p
      LEFT JOIN league_participant_players pp ON p.id = pp.participant_id AND pp.league_id = $2
      WHERE p.user_id = $1 AND p.league_id = $2
      GROUP BY p.id
      ORDER BY p.name
    `, [userId, leagueId]);

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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Check if participant already exists for this user in this league
    const existing = await db.get(
      'SELECT id FROM league_participants WHERE user_id = $1 AND league_id = $2 AND name = $3',
      [userId, leagueId, name]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Participant with this name already exists in this league',
        code: 'PARTICIPANT_EXISTS'
      });
    }

    // Create participant in league  
    const result = await db.get(
      'INSERT INTO league_participants (user_id, league_id, name) VALUES ($1, $2, $3) RETURNING id',
      [userId, leagueId, name]
    );

    const participant = {
      id: result.id,
      name,
      budgetUsed: 0,
      playersCount: 0
    };

    console.log(`👥 New participant created: ${name}`);

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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify participant exists and belongs to user in this league
    const participant = await db.get(
      'SELECT id FROM league_participants WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [participantId, userId, leagueId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found in this league',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Check if name conflicts with another participant in this league
    const existing = await db.get(
      'SELECT id FROM league_participants WHERE user_id = $1 AND league_id = $2 AND name = $3 AND id != $4',
      [userId, leagueId, name, participantId]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Participant with this name already exists in this league',
        code: 'PARTICIPANT_EXISTS'
      });
    }

    // Update participant
    await db.run(
      'UPDATE league_participants SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify participant exists and belongs to user in this league
    const participant = await db.get(
      'SELECT id, name FROM league_participants WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [participantId, userId, leagueId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found in this league',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Delete participant (CASCADE will delete related player assignments)
    await db.run('DELETE FROM league_participants WHERE id = $1', [participantId]);

    console.log(`👥 Participant deleted: ${participant.name}`);

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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify participant belongs to user in this league
    const participant = await db.get(
      'SELECT id, name FROM league_participants WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [participantId, userId, leagueId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found in this league',
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
      FROM league_participant_players pp
      JOIN master_players mp ON pp.master_player_id = mp.id
      WHERE pp.participant_id = $1 AND pp.user_id = $2 AND pp.league_id = $3
      ORDER BY mp.ruolo, mp.nome
    `, [participantId, userId, leagueId]);

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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify participant belongs to user in this league
    const participant = await db.get(
      'SELECT id FROM league_participants WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [participantId, userId, leagueId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found in this league',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Verify player exists
    const player = await db.get('SELECT id, nome FROM master_players WHERE id = $1', [playerId]);
    if (!player) {
      return res.status(404).json({
        error: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
    }

    // Check if player is already assigned to this participant in this league
    const existing = await db.get(
      'SELECT id FROM league_participant_players WHERE participant_id = $1 AND master_player_id = $2 AND user_id = $3 AND league_id = $4',
      [participantId, playerId, userId, leagueId]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Player already assigned to this participant in this league',
        code: 'PLAYER_ALREADY_ASSIGNED'
      });
    }

    // Assign player to participant in league
    const result = await db.get(
      'INSERT INTO league_participant_players (user_id, league_id, participant_id, master_player_id, costo_altri, data_acquisto) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [userId, leagueId, participantId, playerId, costoAltri]
    );

    res.status(201).json({
      message: 'Player assigned to participant successfully',
      assignmentId: result.id,
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
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify participant belongs to user in this league
    const participant = await db.get(
      'SELECT id FROM league_participants WHERE id = $1 AND user_id = $2 AND league_id = $3',
      [participantId, userId, leagueId]
    );

    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found in this league',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Find and delete assignment
    const assignment = await db.get(
      'SELECT id FROM league_participant_players WHERE participant_id = $1 AND master_player_id = $2 AND user_id = $3 AND league_id = $4',
      [participantId, playerId, userId, leagueId]
    );

    if (!assignment) {
      return res.status(404).json({
        error: 'Player assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND'
      });
    }

    await db.run('DELETE FROM league_participant_players WHERE id = $1', [assignment.id]);

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