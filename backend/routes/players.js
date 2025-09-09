import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';
import { logger, errorTracker, dbLogger } from '../utils/logger.js';

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
      component: 'players-route',
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

// Reset all league data for user - clears all players and related data for authenticated user in current league
router.delete('/reset', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.leagueId;
    
    
    // Delete user-specific league data in correct order (foreign keys)
    await db.run('DELETE FROM league_participant_players WHERE user_id = $1 AND league_id = $2', [userId, leagueId]);
    
    await db.run('DELETE FROM league_user_players WHERE user_id = $1 AND league_id = $2', [userId, leagueId]);
    
    await db.run('DELETE FROM league_participants WHERE user_id = $1 AND league_id = $2', [userId, leagueId]);
    
    await db.run('DELETE FROM league_formations WHERE user_id = $1 AND league_id = $2', [userId, leagueId]);
    
    // Optional: Clean up master_players that are no longer referenced
    // (This keeps master players for other users/leagues, only removes orphaned ones)
    await db.run(`
      DELETE FROM master_players 
      WHERE id NOT IN (
        SELECT DISTINCT master_player_id 
        FROM league_user_players 
        WHERE master_player_id IS NOT NULL
      )
    `);
    
    res.json({
      success: true,
      message: 'All league data has been reset successfully'
    });
    
  } catch (error) {
    errorTracker.captureError(error, {
      component: 'players-route',
      action: 'reset-data',
      userId: req.user?.id,
      leagueId: req.leagueId
    });
    next(error);
  }
});

// Debug endpoint to check database connection (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug', async (req, res) => {
    try {
      const db = getDatabase();
      const userId = req.user.id;
      const leagueId = req.leagueId;
      
      // Test basic query
      const testQuery = await db.get('SELECT COUNT(*) as count FROM users WHERE id = $1', [userId]);
      
      // Test master_players table
      const playersCount = await db.get('SELECT COUNT(*) as count FROM master_players');
      
      // Test league membership
      const membership = await db.get('SELECT * FROM league_members WHERE user_id = $1 AND league_id = $2', [userId, leagueId]);
      
      res.json({
        success: true,
        userId,
        leagueId,
        userExists: testQuery,
        playersCount: playersCount,
        membership: membership
      });
      
    } catch (error) {
      errorTracker.captureError(error, {
        component: 'players-route',
        action: 'debug-endpoint',
        userId: req.user?.id,
        leagueId: req.leagueId
      });
      res.status(500).json({
        error: 'Debug failed',
        message: error.message,
      stack: error.stack
      });
    }
  });
}

// Get all players for the authenticated user
router.get('/', [
  query('status').optional().isIn(['available', 'owned', 'removed', 'interesting']),
  query('role').optional().isString(),
  query('search').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const { status, role, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [userId, leagueId, userId, leagueId];

    // Add status filtering
    if (status === 'interesting') {
      whereClause += ' AND up.interessante = true';
    } else if (status) {
      whereClause += ' AND COALESCE(up.status, \'available\') = $' + (params.length + 1);
      params.push(status);
    }

    // Add role filtering
    if (role) {
      whereClause += ' AND mp.ruolo = $' + (params.length + 1);
      params.push(role);
    }

    // Add search filtering
    if (search) {
      whereClause += ' AND (LOWER(mp.nome) LIKE $' + (params.length + 1) + ' OR LOWER(mp.squadra) LIKE $' + (params.length + 2) + ')';
      const searchTerm = `%${search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm);
    }

    const players = await db.all(`
      SELECT 
        mp.id as master_id,
        mp.nome,
        mp.squadra,
        mp.ruolo,
        mp.prezzo,
        mp.fvm,
        mp.season,
        COALESCE(up.status, 'available') as status,
        COALESCE(up.interessante, false) as interessante,
        COALESCE(up.rimosso, false) as rimosso,
        up.costo_reale,
        up.prezzo_atteso,
        up.acquistatore,
        up.data_acquisto,
        up.data_rimozione,
        up.tier,
        up.note,
        pp.participant_id,
        p.name as owned_by_participant,
        pp.costo_altri
      FROM master_players mp
      LEFT JOIN league_user_players up ON mp.id = up.master_player_id AND up.user_id = $1 AND up.league_id = $2
      LEFT JOIN league_participant_players pp ON mp.id = pp.master_player_id AND pp.user_id = $3 AND pp.league_id = $4
      LEFT JOIN league_participants p ON pp.participant_id = p.id AND p.league_id = $4
      ${whereClause}
      ORDER BY mp.ruolo, mp.nome
    `, params);

    res.json({
      players: players.map(player => ({
        id: player.master_id,
        nome: player.nome,
        squadra: player.squadra,
        ruolo: player.ruolo,
        prezzo: player.prezzo,
        fvm: player.fvm,
        season: player.season,
        status: player.status,
        interessante: Boolean(player.interessante),
        rimosso: Boolean(player.rimosso),
        costoReale: player.costo_reale || 0,
        prezzoAtteso: player.prezzo_atteso || player.prezzo || 0,
        acquistatore: player.acquistatore,
        dataAcquisto: player.data_acquisto,
        dataRimozione: player.data_rimozione,
        tier: player.tier,
        note: player.note,
        proprietario: player.owned_by_participant,
        costoAltri: player.costo_altri || 0
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Import players from Excel (bulk create/update master players)
router.post('/import', [
  body('players').isArray().withMessage('Players must be an array'),
  body('players.*.nome').notEmpty().withMessage('Player name required'),
  body('players.*.ruolo').notEmpty().withMessage('Player role required'),
  body('mode').optional().isIn(['1', '2', '3', '4']).withMessage('Invalid import mode')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { players, mode = '1' } = req.body;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();
    
    let importedCount = 0;
    let updatedCount = 0;

    for (const playerData of players) {
      try {
        // Insert or update master player
        const existingPlayer = await db.get(
          'SELECT id FROM master_players WHERE nome = ? AND squadra = ? AND season = ?',
          [playerData.nome, playerData.squadra || '', '2025-26']
        );

        let masterId;
        if (existingPlayer) {
          // Update existing master player
          await db.run(`
            UPDATE master_players 
            SET ruolo = ?, prezzo = ?, fvm = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [playerData.ruolo, playerData.prezzo || 0, playerData.fvm || 0, existingPlayer.id]);
          masterId = existingPlayer.id;
          updatedCount++;
        } else {
          // Create new master player
          const result = await db.run(`
            INSERT INTO master_players (nome, squadra, ruolo, prezzo, fvm, season)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            playerData.nome,
            playerData.squadra || '',
            playerData.ruolo,
            playerData.prezzo || 0,
            playerData.fvm || 0,
            '2025-26'
          ]);
          masterId = result.lastID;
          importedCount++;
        }

        // Handle league-specific player data based on mode
        const existingUserPlayer = await db.get(
          'SELECT id FROM league_user_players WHERE user_id = $1 AND league_id = $2 AND master_player_id = $3',
          [userId, leagueId, masterId]
        );

        let status = 'available';
        let interessante = false;
        let rimosso = false;
        let tier = null;
        let prezzoAtteso = playerData.prezzo || 0;

        // Apply import mode logic
        switch (mode) {
          case '1': // FVM distribution
            if (playerData.fvm >= 20) tier = 'Top';
            else if (playerData.fvm >= 10) tier = 'Titolari';
            else if (playerData.fvm >= 5) tier = 'Low cost';
            else if (playerData.fvm >= 2) tier = 'Jolly';
            else tier = 'Riserve';
            break;
          
          case '2': // FVM distribution + remove FVM=1
            if (playerData.fvm === 1) {
              rimosso = true;
              status = 'removed';
            } else if (playerData.fvm >= 20) tier = 'Top';
            else if (playerData.fvm >= 10) tier = 'Titolari';
            else if (playerData.fvm >= 5) tier = 'Low cost';
            else if (playerData.fvm >= 2) tier = 'Jolly';
            else tier = 'Riserve';
            break;
          
          case '3': // All to "Non inseriti"
            tier = 'Non inseriti';
            break;
          
          case '4': // Non inseriti + remove FVM=1
            if (playerData.fvm === 1) {
              rimosso = true;
              status = 'removed';
            } else {
              tier = 'Non inseriti';
            }
            break;
        }

        // Insert or update league user player data
        if (existingUserPlayer) {
          await db.run(`
            UPDATE league_user_players 
            SET status = $1, interessante = $2, rimosso = $3, tier = $4, prezzo_atteso = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [status, interessante, rimosso, tier, prezzoAtteso, existingUserPlayer.id]);
        } else {
          await db.run(`
            INSERT INTO league_user_players (user_id, league_id, master_player_id, status, interessante, rimosso, tier, prezzo_atteso)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [userId, leagueId, masterId, status, interessante, rimosso, tier, prezzoAtteso]);
        }

      } catch (playerError) {
        logger.error('Error importing individual player', {
          component: 'players-route',
          action: 'batch-import',
          playerName: playerData.nome,
          error: playerError.message,
          stack: playerError.stack,
          userId: req.user?.id,
          leagueId: req.leagueId
        });
        // Continue with other players
      }
    }


    res.json({
      message: 'Players imported successfully',
      imported: importedCount,
      updated: updatedCount,
      total: players.length,
      mode
    });

  } catch (error) {
    next(error);
  }
});

// Update player status
router.patch('/:playerId/status', [
  body('status').isIn(['available', 'owned', 'removed', 'interesting']).withMessage('Invalid status'),
  body('costoReale').optional().isNumeric().withMessage('Cost must be numeric'),
  body('prezzoAtteso').optional().isNumeric().withMessage('Expected price must be numeric'),
  body('acquistatore').optional().isString().withMessage('Acquistatore must be string'),
  body('note').optional().isLength({ max: 500 }).withMessage('Note too long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { playerId } = req.params;
    const { status, costoReale, note, prezzoAtteso, acquistatore } = req.body;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();

    // Verify player exists
    const masterPlayer = await db.get('SELECT id FROM master_players WHERE id = $1', [playerId]);
    if (!masterPlayer) {
      return res.status(404).json({
        error: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
    }

    // Get or create league user player record
    let userPlayer = await db.get(
      'SELECT id FROM league_user_players WHERE user_id = $1 AND league_id = $2 AND master_player_id = $3',
      [userId, leagueId, playerId]
    );

    const updateData = {
      status,
      interessante: status === 'interesting',
      rimosso: status === 'removed',
      costo_reale: costoReale || 0,
      prezzo_atteso: prezzoAtteso || 0,
      acquistatore: acquistatore || null,
      note: note || null,
      data_acquisto: status === 'owned' ? 'CURRENT_TIMESTAMP' : null,
      data_rimozione: status === 'removed' ? 'CURRENT_TIMESTAMP' : null
    };

    if (userPlayer) {
      // Update existing record
      await db.run(`
        UPDATE league_user_players 
        SET status = $1, interessante = $2, rimosso = $3, costo_reale = $4, prezzo_atteso = $5, 
            acquistatore = $6, note = $7, 
            data_acquisto = CASE WHEN $8 = 'owned' THEN CURRENT_TIMESTAMP ELSE data_acquisto END,
            data_rimozione = CASE WHEN $9 = 'removed' THEN CURRENT_TIMESTAMP ELSE data_rimozione END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
      `, [
        updateData.status, updateData.interessante, updateData.rimosso,
        updateData.costo_reale, updateData.prezzo_atteso, updateData.acquistatore,
        updateData.note, status, status, userPlayer.id
      ]);
    } else {
      // Create new record
      await db.run(`
        INSERT INTO league_user_players (user_id, league_id, master_player_id, status, interessante, rimosso, 
                                        costo_reale, prezzo_atteso, acquistatore, note,
                                        data_acquisto, data_rimozione, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                CASE WHEN $11 = 'owned' THEN CURRENT_TIMESTAMP ELSE NULL END,
                CASE WHEN $12 = 'removed' THEN CURRENT_TIMESTAMP ELSE NULL END,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        userId, leagueId, playerId, updateData.status, updateData.interessante, updateData.rimosso,
        updateData.costo_reale, updateData.prezzo_atteso, updateData.acquistatore,
        updateData.note, status, status
      ]);
    }

    res.json({
      message: 'Player status updated successfully',
      playerId: parseInt(playerId),
      status,
      costoReale: updateData.costo_reale,
      prezzoAtteso: updateData.prezzo_atteso,
      acquistatore: updateData.acquistatore
    });

  } catch (error) {
    next(error);
  }
});

// Get player statistics for the user
router.get('/stats', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const leagueId = req.leagueId;

    // Get league settings
    const settings = await db.get(
      'SELECT total_budget, max_players_per_team as max_players FROM leagues WHERE id = $1',
      [leagueId]
    );

    if (!settings) {
      return res.status(404).json({
        error: 'League settings not found',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    // Get owned players stats
    const ownedStats = await db.get(`
      SELECT 
        COUNT(*) as players_owned,
        COALESCE(SUM(up.costo_reale), 0) as budget_used
      FROM league_user_players up
      WHERE up.user_id = $1 AND up.league_id = $2 AND up.status = 'owned'
    `, [userId, leagueId]);

    // Get role distribution
    const roleDistribution = await db.all(`
      SELECT 
        mp.ruolo,
        COUNT(*) as count
      FROM league_user_players up
      JOIN master_players mp ON up.master_player_id = mp.id
      WHERE up.user_id = $1 AND up.league_id = $2 AND up.status = 'owned'
      GROUP BY mp.ruolo
    `, [userId, leagueId]);

    const roleDistObj = {};
    roleDistribution.forEach(role => {
      roleDistObj[role.ruolo] = role.count;
    });

    res.json({
      totalBudget: settings.total_budget,
      maxPlayers: settings.max_players,
      budgetUsed: ownedStats.budget_used,
      budgetRemaining: settings.total_budget - ownedStats.budget_used,
      playersOwned: ownedStats.players_owned,
      playersRemaining: settings.max_players - ownedStats.players_owned,
      roleDistribution: roleDistObj,
      rolesConfig: rolesConfig
    });

  } catch (error) {
    next(error);
  }
});

// Fast batch import for Excel upload with progress tracking
router.post('/import/batch', [
  body('players').isArray().withMessage('Players must be an array'),
  body('players.*.nome').notEmpty().withMessage('Player name required'),
  body('players.*.ruolo').notEmpty().withMessage('Player role required'),
  body('batchSize').optional().isInt({ min: 50, max: 200 }).withMessage('Batch size must be 50-200')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { players, batchSize = 100 } = req.body;
    const userId = req.user.id;
    const leagueId = req.leagueId;
    const db = getDatabase();
    
    
    let processedCount = 0;
    const startTime = Date.now();

    // Process in batches for better performance
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(players.length/batchSize);
      
      
      // Prepare batch insert values for master_players
      const masterPlayersValues = [];
      const masterPlayersParams = [];
      
      for (const player of batch) {
        masterPlayersValues.push('(?, ?, ?, ?, ?, ?)');
        masterPlayersParams.push(
          player.nome,
          player.squadra || '',
          player.ruolo,
          player.prezzo || 0,
          player.fvm || 0,
          '2025-26'
        );
      }

      // Batch insert master players using UPSERT (PostgreSQL)
      const batchInsertSQL = `
        INSERT INTO master_players (nome, squadra, ruolo, prezzo, fvm, season)
        VALUES ${masterPlayersValues.join(', ')}
        ON CONFLICT (nome, squadra, season) 
        DO UPDATE SET 
          ruolo = EXCLUDED.ruolo,
          prezzo = EXCLUDED.prezzo,
          fvm = EXCLUDED.fvm,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, nome
      `;
      
      await db.all(batchInsertSQL, masterPlayersParams);
      processedCount += batch.length;
      
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Players imported successfully with fast batch processing',
      processed: processedCount,
      total: players.length,
      duration: duration,
      batchSize: batchSize,
      batches: Math.ceil(players.length / batchSize)
    });

  } catch (error) {
    errorTracker.captureError(error, {
      component: 'players-route',
      action: 'batch-import',
      userId: req.user?.id,
      leagueId: req.leagueId
    });
    next(error);
  }
});

export default router;