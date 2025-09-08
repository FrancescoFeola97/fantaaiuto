import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/postgres-init.js';

const router = express.Router();

// Get all leagues for the authenticated user (as owner or member)
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const leagues = await db.all(`
      SELECT 
        l.id,
        l.name,
        l.code,
        l.owner_id,
        l.game_mode,
        l.total_budget,
        l.max_players_per_team,
        l.max_members,
        l.status,
        l.season,
        l.description,
        l.created_at,
        l.updated_at,
        lm.role,
        lm.team_name,
        lm.budget_used,
        lm.players_count,
        (SELECT COUNT(*) FROM league_members lm2 WHERE lm2.league_id = l.id) as members_count,
        u.username as owner_username
      FROM leagues l
      JOIN league_members lm ON l.id = lm.league_id
      LEFT JOIN users u ON l.owner_id = u.id
      WHERE lm.user_id = ?1
      ORDER BY l.created_at DESC
    `, [userId]);

    res.json({
      leagues: leagues.map(l => ({
        id: l.id,
        name: l.name,
        code: l.code,
        ownerId: l.owner_id,
        gameMode: l.game_mode,
        totalBudget: l.total_budget,
        maxPlayersPerTeam: l.max_players_per_team,
        maxMembers: l.max_members,
        status: l.status,
        season: l.season,
        description: l.description,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        isOwner: l.owner_id === userId,
        userRole: l.role,
        userTeamName: l.team_name,
        userBudgetUsed: l.budget_used,
        userPlayersCount: l.players_count,
        membersCount: l.members_count,
        ownerUsername: l.owner_username
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get specific league details
router.get('/:leagueId', async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Check if user is member of this league
    const membership = await db.get(`
      SELECT lm.role, lm.team_name, lm.budget_used, lm.players_count
      FROM league_members lm
      WHERE lm.league_id = ?1 AND lm.user_id = ?2
    `, [leagueId, userId]);

    if (!membership) {
      return res.status(403).json({
        error: 'Access denied. You are not a member of this league.',
        code: 'NOT_LEAGUE_MEMBER'
      });
    }

    // Get league details
    const league = await db.get(`
      SELECT 
        l.id,
        l.name,
        l.code,
        l.owner_id,
        l.game_mode,
        l.total_budget,
        l.max_players_per_team,
        l.max_members,
        l.status,
        l.season,
        l.description,
        l.created_at,
        l.updated_at,
        u.username as owner_username,
        (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) as members_count
      FROM leagues l
      LEFT JOIN users u ON l.owner_id = u.id
      WHERE l.id = ?
    `, [leagueId]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    res.json({
      league: {
        id: league.id,
        name: league.name,
        code: league.code,
        ownerId: league.owner_id,
        gameMode: league.game_mode,
        totalBudget: league.total_budget,
        maxPlayersPerTeam: league.max_players_per_team,
        maxMembers: league.max_members,
        status: league.status,
        season: league.season,
        description: league.description,
        createdAt: league.created_at,
        updatedAt: league.updated_at,
        isOwner: league.owner_id === userId,
        userRole: membership.role,
        userTeamName: membership.team_name,
        userBudgetUsed: membership.budget_used,
        userPlayersCount: membership.players_count,
        membersCount: league.members_count,
        ownerUsername: league.owner_username
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new league
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('League name is required and must be less than 100 characters'),
  body('gameMode').isIn(['Classic', 'Mantra']).withMessage('Game mode must be Classic or Mantra'),
  body('totalBudget').isInt({ min: 100, max: 2000 }).withMessage('Total budget must be between 100 and 2000'),
  body('maxPlayersPerTeam').isInt({ min: 11, max: 50 }).withMessage('Max players per team must be between 11 and 50'),
  body('maxMembers').isInt({ min: 2, max: 50 }).withMessage('Max members must be between 2 and 50'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, gameMode, totalBudget, maxPlayersPerTeam, maxMembers, description } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Create league
    const result = await db.run(`
      INSERT INTO leagues (name, owner_id, game_mode, total_budget, max_players_per_team, max_members, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, userId, gameMode, totalBudget, maxPlayersPerTeam, maxMembers, description || null]);

    const leagueId = result.lastID;

    // Get the created league with generated code
    const createdLeague = await db.get(`
      SELECT 
        l.id, l.name, l.code, l.owner_id, l.game_mode, l.total_budget, 
        l.max_players_per_team, l.max_members, l.status, l.season, 
        l.description, l.created_at, l.updated_at,
        u.username as owner_username
      FROM leagues l
      LEFT JOIN users u ON l.owner_id = u.id
      WHERE l.id = ?
    `, [leagueId]);

    console.log(`🏆 New league created: ?{name} (ID: ?{leagueId}, Code: ?{createdLeague.code}) by user ?{userId}`);

    res.status(201).json({
      message: 'League created successfully',
      league: {
        id: createdLeague.id,
        name: createdLeague.name,
        code: createdLeague.code,
        ownerId: createdLeague.owner_id,
        gameMode: createdLeague.game_mode,
        totalBudget: createdLeague.total_budget,
        maxPlayersPerTeam: createdLeague.max_players_per_team,
        maxMembers: createdLeague.max_members,
        status: createdLeague.status,
        season: createdLeague.season,
        description: createdLeague.description,
        createdAt: createdLeague.created_at,
        updatedAt: createdLeague.updated_at,
        isOwner: true,
        userRole: 'master',
        membersCount: 1,
        ownerUsername: createdLeague.owner_username
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update league settings (only by owner)
router.put('/:leagueId', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('League name must be less than 100 characters'),
  body('totalBudget').optional().isInt({ min: 100, max: 2000 }).withMessage('Total budget must be between 100 and 2000'),
  body('maxPlayersPerTeam').optional().isInt({ min: 11, max: 50 }).withMessage('Max players per team must be between 11 and 50'),
  body('maxMembers').optional().isInt({ min: 2, max: 50 }).withMessage('Max members must be between 2 and 50'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { leagueId } = req.params;
    const { name, totalBudget, maxPlayersPerTeam, maxMembers, description } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify user is the league owner
    const league = await db.get(`
      SELECT owner_id FROM leagues WHERE id = ?
    `, [leagueId]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    if (league.owner_id !== userId) {
      return res.status(403).json({
        error: 'Only league owners can update league settings',
        code: 'NOT_LEAGUE_OWNER'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (totalBudget !== undefined) {
      updates.push('total_budget = ?');
      values.push(totalBudget);
    }
    if (maxPlayersPerTeam !== undefined) {
      updates.push('max_players_per_team = ?');
      values.push(maxPlayersPerTeam);
    }
    if (maxMembers !== undefined) {
      updates.push('max_members = ?');
      values.push(maxMembers);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(leagueId);

    await db.run(`
      UPDATE leagues 
      SET ?{updates.join(', ')}
      WHERE id = ?
    `, values);

    res.json({
      message: 'League updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get league members
router.get('/:leagueId/members', async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify user is member of league
    const membership = await db.get(`
      SELECT role FROM league_members WHERE league_id = ? AND user_id = ?
    `, [leagueId, userId]);

    if (!membership) {
      return res.status(403).json({
        error: 'Access denied. You are not a member of this league.',
        code: 'NOT_LEAGUE_MEMBER'
      });
    }

    // Get all league members
    const members = await db.all(`
      SELECT 
        lm.id,
        lm.league_id,
        lm.user_id,
        lm.role,
        lm.team_name,
        lm.budget_used,
        lm.players_count,
        lm.joined_at,
        u.username,
        u.email
      FROM league_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.league_id = ?
      ORDER BY lm.role DESC, lm.joined_at ASC
    `, [leagueId]);

    res.json({
      members: members.map(m => ({
        id: m.id,
        leagueId: m.league_id,
        userId: m.user_id,
        role: m.role,
        teamName: m.team_name,
        budgetUsed: m.budget_used,
        playersCount: m.players_count,
        joinedAt: m.joined_at,
        username: m.username,
        email: m.email
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Join league by code
router.post('/join', [
  body('code').trim().isLength({ min: 1, max: 10 }).withMessage('League code is required'),
  body('teamName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Team name must be less than 100 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { code, teamName } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Find league by code
    const league = await db.get(`
      SELECT 
        l.id, l.name, l.owner_id, l.max_members, l.status,
        (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) as current_members
      FROM leagues l 
      WHERE l.code = ? AND l.status = 'active'
    `, [code]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found or inactive',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    // Check if league is full
    if (league.current_members >= league.max_members) {
      return res.status(409).json({
        error: 'League is full',
        code: 'LEAGUE_FULL'
      });
    }

    // Check if user is already a member
    const existingMembership = await db.get(`
      SELECT id FROM league_members WHERE league_id = ? AND user_id = ?
    `, [league.id, userId]);

    if (existingMembership) {
      return res.status(409).json({
        error: 'You are already a member of this league',
        code: 'ALREADY_MEMBER'
      });
    }

    // Add user to league
    const result = await db.run(`
      INSERT INTO league_members (league_id, user_id, role, team_name)
      VALUES (?, ?, 'member', ?)
    `, [league.id, userId, teamName || 'My Team']);

    console.log(`👥 User ?{userId} joined league ?{league.name} (ID: ?{league.id})`);

    res.status(201).json({
      message: 'Successfully joined league',
      leagueId: league.id,
      membershipId: result.lastID
    });

  } catch (error) {
    next(error);
  }
});

// Leave league (members only, owners cannot leave)
router.delete('/:leagueId/leave', async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Get user's membership info
    const membership = await db.get(`
      SELECT lm.id, lm.role, l.owner_id
      FROM league_members lm
      JOIN leagues l ON lm.league_id = l.id
      WHERE lm.league_id = ? AND lm.user_id = ?
    `, [leagueId, userId]);

    if (!membership) {
      return res.status(404).json({
        error: 'You are not a member of this league',
        code: 'NOT_MEMBER'
      });
    }

    if (membership.role === 'master') {
      return res.status(409).json({
        error: 'League owners cannot leave their own league. Delete the league instead.',
        code: 'CANNOT_LEAVE_OWN_LEAGUE'
      });
    }

    // Remove user from league (CASCADE will clean up related data)
    await db.run(`DELETE FROM league_members WHERE id = ?`, [membership.id]);

    console.log(`👥 User ?{userId} left league ?{leagueId}`);

    res.json({
      message: 'Successfully left league'
    });

  } catch (error) {
    next(error);
  }
});

// Delete league (owners only)
router.delete('/:leagueId', async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify user is the league owner
    const league = await db.get(`
      SELECT owner_id, name FROM leagues WHERE id = ?
    `, [leagueId]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    if (league.owner_id !== userId) {
      return res.status(403).json({
        error: 'Only league owners can delete leagues',
        code: 'NOT_LEAGUE_OWNER'
      });
    }

    // Delete league (CASCADE will clean up all related data)
    await db.run(`DELETE FROM leagues WHERE id = ?`, [leagueId]);

    console.log(`🏆 League deleted: ?{league.name} (ID: ?{leagueId}) by user ?{userId}`);

    res.json({
      message: 'League deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get league invite info (public endpoint for sharing)
router.get('/invite/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const db = getDatabase();

    const league = await db.get(`
      SELECT 
        l.id,
        l.name,
        l.game_mode,
        l.max_members,
        l.status,
        u.username as owner_username,
        (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) as members_count
      FROM leagues l
      LEFT JOIN users u ON l.owner_id = u.id
      WHERE l.code = ? AND l.status = 'active'
    `, [code]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found or inactive',
        code: 'LEAGUE_NOT_FOUND'
      });
    }

    res.json({
      invite: {
        code: code,
        leagueName: league.name,
        ownerName: league.owner_username,
        gameMode: league.game_mode,
        membersCount: league.members_count,
        maxMembers: league.max_members,
        isFull: league.members_count >= league.max_members
      }
    });

  } catch (error) {
    next(error);
  }
});

// Invite user to league by username (only master can do this)
router.post('/:leagueId/invite/username', [
  body('username').trim().isLength({ min: 1, max: 50 }).withMessage('Username is required'),
  body('teamName').optional().trim().isLength({ max: 100 }).withMessage('Team name too long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { leagueId } = req.params;
    const { username, teamName } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    // Verify league exists and user is the owner/master
    const league = await db.get(`
      SELECT 
        l.id, l.name, l.max_members, l.status,
        (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) as members_count
      FROM leagues l
      WHERE l.id = ?1 AND l.owner_id = ?2 AND l.status = 'active'
    `, [leagueId, userId]);

    if (!league) {
      return res.status(404).json({
        error: 'League not found or you are not the master of this league',
        code: 'LEAGUE_NOT_FOUND_OR_NO_PERMISSION'
      });
    }

    // Check if league is full
    if (league.members_count >= league.max_members) {
      return res.status(400).json({
        error: 'League is already full',
        code: 'LEAGUE_FULL'
      });
    }

    // Find user by username
    const invitedUser = await db.get('SELECT id, username FROM users WHERE username = ?1', [username]);
    if (!invitedUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already a member
    const existingMember = await db.get(
      'SELECT id FROM league_members WHERE league_id = ?1 AND user_id = ?2',
      [leagueId, invitedUser.id]
    );

    if (existingMember) {
      return res.status(409).json({
        error: 'User is already a member of this league',
        code: 'ALREADY_MEMBER'
      });
    }

    // Add user to league
    await db.run(
      'INSERT INTO league_members (league_id, user_id, role, team_name) VALUES (?1, ?2, ?3, ?4)',
      [leagueId, invitedUser.id, 'member', teamName || invitedUser.username]
    );

    console.log(`📨 User ?{invitedUser.username} invited to league ?{league.name} by master ?{req.user.username}`);

    res.status(201).json({
      message: 'User successfully added to league',
      invitedUser: {
        id: invitedUser.id,
        username: invitedUser.username
      },
      league: {
        id: league.id,
        name: league.name
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;