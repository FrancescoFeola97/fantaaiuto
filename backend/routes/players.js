import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';

const router = express.Router();

// Debug endpoint to check database connection
router.get('/debug', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    console.log('🔍 Debug: user ID:', userId);
    
    // Test basic query
    const testQuery = await db.get('SELECT COUNT(*) as count FROM users WHERE id = ?', [userId]);
    console.log('🔍 Debug: user exists:', testQuery);
    
    // Test master_players table
    const playersCount = await db.get('SELECT COUNT(*) as count FROM master_players');
    console.log('🔍 Debug: master_players count:', playersCount);
    
    res.json({
      success: true,
      userId,
      userExists: testQuery,
      playersCount: playersCount
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    });
  }
});

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
    const { status, role, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [userId, userId];

    // Add status filtering
    if (status === 'interesting') {
      whereClause += ' AND up.interessante = true';
    } else if (status) {
      whereClause += ' AND COALESCE(up.status, \'available\') = ?';
      params.push(status);
    }

    // Add role filtering
    if (role) {
      whereClause += ' AND mp.ruolo = ?';
      params.push(role);
    }

    // Add search filtering
    if (search) {
      whereClause += ' AND (LOWER(mp.nome) LIKE ? OR LOWER(mp.squadra) LIKE ?)';
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
      LEFT JOIN user_players up ON mp.id = up.master_player_id AND up.user_id = ?
      LEFT JOIN participant_players pp ON mp.id = pp.master_player_id AND pp.user_id = ?
      LEFT JOIN participants p ON pp.participant_id = p.id
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

        // Handle user-specific player data based on mode
        const existingUserPlayer = await db.get(
          'SELECT id FROM user_players WHERE user_id = ? AND master_player_id = ?',
          [userId, masterId]
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

        // Insert or update user player data
        if (existingUserPlayer) {
          await db.run(`
            UPDATE user_players 
            SET status = ?, interessante = ?, rimosso = ?, tier = ?, prezzo_atteso = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [status, interessante, rimosso, tier, prezzoAtteso, existingUserPlayer.id]);
        } else {
          await db.run(`
            INSERT INTO user_players (user_id, master_player_id, status, interessante, rimosso, tier, prezzo_atteso)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [userId, masterId, status, interessante, rimosso, tier, prezzoAtteso]);
        }

      } catch (playerError) {
        console.error(`Error importing player ${playerData.nome}:`, playerError);
        // Continue with other players
      }
    }

    console.log(`📊 Player import completed for user ${userId}: ${importedCount} new, ${updatedCount} updated`);

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
    const db = getDatabase();

    // Verify player exists
    const masterPlayer = await db.get('SELECT id FROM master_players WHERE id = ?', [playerId]);
    if (!masterPlayer) {
      return res.status(404).json({
        error: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
    }

    // Get or create user player record
    let userPlayer = await db.get(
      'SELECT id FROM user_players WHERE user_id = ? AND master_player_id = ?',
      [userId, playerId]
    );

    const updateData = {
      status,
      interessante: status === 'interesting' ? 1 : 0,
      rimosso: status === 'removed' ? 1 : 0,
      costo_reale: costoReale || 0,
      prezzo_atteso: prezzoAtteso || 0,
      acquistatore: acquistatore || null,
      note: note || null,
      data_acquisto: status === 'owned' ? new Date().toISOString() : null,
      data_rimozione: status === 'removed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    if (userPlayer) {
      // Update existing record
      await db.run(`
        UPDATE user_players 
        SET status = ?, interessante = ?, rimosso = ?, costo_reale = ?, prezzo_atteso = ?, 
            acquistatore = ?, note = ?, data_acquisto = ?, data_rimozione = ?, updated_at = ?
        WHERE id = ?
      `, [
        updateData.status, updateData.interessante, updateData.rimosso,
        updateData.costo_reale, updateData.prezzo_atteso, updateData.acquistatore,
        updateData.note, updateData.data_acquisto, updateData.data_rimozione, 
        updateData.updated_at, userPlayer.id
      ]);
    } else {
      // Create new record
      await db.run(`
        INSERT INTO user_players (user_id, master_player_id, status, interessante, rimosso, 
                                 costo_reale, prezzo_atteso, acquistatore, note, data_acquisto, data_rimozione)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, playerId, updateData.status, updateData.interessante, updateData.rimosso,
        updateData.costo_reale, updateData.prezzo_atteso, updateData.acquistatore,
        updateData.note, updateData.data_acquisto, updateData.data_rimozione
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

    // Get user settings
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

    // Get owned players stats
    const ownedStats = await db.get(`
      SELECT 
        COUNT(*) as players_owned,
        COALESCE(SUM(up.costo_reale), 0) as budget_used
      FROM user_players up
      WHERE up.user_id = ? AND up.status = 'owned'
    `, [userId]);

    // Get role distribution
    const roleDistribution = await db.all(`
      SELECT 
        mp.ruolo,
        COUNT(*) as count
      FROM user_players up
      JOIN master_players mp ON up.master_player_id = mp.id
      WHERE up.user_id = ? AND up.status = 'owned'
      GROUP BY mp.ruolo
    `, [userId]);

    const roleDistObj = {};
    const rolesConfig = JSON.parse(settings.roles_config || '{}');
    Object.keys(rolesConfig).forEach(role => {
      roleDistObj[role] = 0;
    });
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

export default router;