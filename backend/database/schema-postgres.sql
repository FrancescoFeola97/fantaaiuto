-- FantaAiuto Multi-User Database Schema - PostgreSQL Version

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User settings (budget, max players, etc.)
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_budget INTEGER DEFAULT 500,
    max_players INTEGER DEFAULT 30,
    roles_config TEXT, -- JSON string with role limits
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Master players list (shared across all users, updated from Excel imports)
CREATE TABLE IF NOT EXISTS master_players (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    squadra VARCHAR(100),
    ruolo VARCHAR(10) NOT NULL,
    prezzo INTEGER,
    fvm INTEGER DEFAULT 0,
    season VARCHAR(10) DEFAULT '2025-26',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nome, squadra, season)
);

-- User-specific player data (ownership, interest, status per user)
CREATE TABLE IF NOT EXISTS user_players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    master_player_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'owned', 'removed', 'interesting'
    interessante BOOLEAN DEFAULT FALSE,
    rimosso BOOLEAN DEFAULT FALSE,
    costo_reale INTEGER DEFAULT 0,
    prezzo_atteso INTEGER DEFAULT 0,
    acquistatore VARCHAR(100),
    data_acquisto TIMESTAMP,
    data_rimozione TIMESTAMP,
    tier VARCHAR(20), -- 'Top', 'Titolari', 'Low cost', etc.
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (master_player_id) REFERENCES master_players(id) ON DELETE CASCADE,
    UNIQUE(user_id, master_player_id)
);

-- League participants (other fantasy players)
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    squadra VARCHAR(100), -- Team name for participant
    budget_used INTEGER DEFAULT 0,
    players_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Players owned by other participants
CREATE TABLE IF NOT EXISTS participant_players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- The user who tracks this info
    participant_id INTEGER NOT NULL,
    master_player_id INTEGER NOT NULL,
    costo_altri INTEGER DEFAULT 0,
    data_acquisto TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (master_player_id) REFERENCES master_players(id) ON DELETE CASCADE,
    UNIQUE(user_id, participant_id, master_player_id)
);

-- User formations
CREATE TABLE IF NOT EXISTS formations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    schema VARCHAR(20) NOT NULL, -- e.g., "4-3-3", "3-5-2"
    players TEXT, -- JSON array of player IDs
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Formation images
CREATE TABLE IF NOT EXISTS formation_images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log for important actions
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ===============================================
-- LEAGUE SYSTEM TABLES (Multi-league support)
-- ===============================================

-- Leagues table: Core league information
CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- Invite code
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL DEFAULT 'Mantra' CHECK (game_mode IN ('Classic', 'Mantra')),
    total_budget INTEGER NOT NULL DEFAULT 500,
    max_players_per_team INTEGER NOT NULL DEFAULT 25,
    max_members INTEGER NOT NULL DEFAULT 20,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'completed')),
    season VARCHAR(10) NOT NULL DEFAULT '2025-26',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League members: Users participating in leagues
CREATE TABLE IF NOT EXISTS league_members (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('master', 'member')),
    team_name VARCHAR(100),
    budget_used INTEGER DEFAULT 0,
    players_count INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, user_id) -- User can only be in a league once
);

-- League-specific user players (replaces user_players for league context)
CREATE TABLE IF NOT EXISTS league_user_players (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    master_player_id INTEGER NOT NULL REFERENCES master_players(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'owned', 'removed', 'taken_by_other')),
    interessante BOOLEAN DEFAULT FALSE,
    rimosso BOOLEAN DEFAULT FALSE,
    costo_reale INTEGER DEFAULT 0,
    prezzo_atteso INTEGER DEFAULT 0,
    acquistatore VARCHAR(100), -- Name of the buyer (for taken_by_other)
    data_acquisto TIMESTAMP,
    data_rimozione TIMESTAMP,
    tier VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, user_id, master_player_id) -- Each player can only have one status per user per league
);

-- League-specific participants (replaces participants for league context)
CREATE TABLE IF NOT EXISTS league_participants (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budget_used INTEGER DEFAULT 0,
    players_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League-specific participant players (replaces participant_players for league context)
CREATE TABLE IF NOT EXISTS league_participant_players (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES league_participants(id) ON DELETE CASCADE,
    master_player_id INTEGER NOT NULL REFERENCES master_players(id) ON DELETE CASCADE,
    costo_altri INTEGER DEFAULT 0,
    data_acquisto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League-specific formations (replaces formations for league context)
CREATE TABLE IF NOT EXISTS league_formations (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    schema VARCHAR(20) NOT NULL, -- e.g., "4-3-3", "3-5-2"
    players TEXT, -- JSON array of player IDs and positions
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League-specific settings (per user, per league)
CREATE TABLE IF NOT EXISTS league_user_settings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_budget INTEGER,
    max_players INTEGER,
    roles_config JSONB,
    game_mode VARCHAR(20) DEFAULT 'Mantra',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, user_id) -- Each user has one settings record per league
);

-- ===============================================
-- FUNCTIONS AND TRIGGERS FOR LEAGUE SYSTEM
-- ===============================================

-- Function to generate unique league codes
CREATE OR REPLACE FUNCTION generate_league_code() RETURNS VARCHAR(10) AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        new_code := UPPER(
            substring(
                md5(random()::text || clock_timestamp()::text) 
                from 1 for 6
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM leagues WHERE code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate league codes
CREATE OR REPLACE FUNCTION set_league_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_league_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leagues_code_trigger ON leagues;
CREATE TRIGGER leagues_code_trigger 
    BEFORE INSERT ON leagues 
    FOR EACH ROW 
    EXECUTE FUNCTION set_league_code();

-- Trigger to automatically add league owner as master member
CREATE OR REPLACE FUNCTION add_league_owner_as_master() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO league_members (league_id, user_id, role, team_name)
    VALUES (NEW.id, NEW.owner_id, 'master', 'My Team');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leagues_add_owner_trigger ON leagues;
CREATE TRIGGER leagues_add_owner_trigger 
    AFTER INSERT ON leagues 
    FOR EACH ROW 
    EXECUTE FUNCTION add_league_owner_as_master();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leagues_update_timestamp ON leagues;
CREATE TRIGGER leagues_update_timestamp 
    BEFORE UPDATE ON leagues 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS league_user_players_update_timestamp ON league_user_players;
CREATE TRIGGER league_user_players_update_timestamp 
    BEFORE UPDATE ON league_user_players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS league_participants_update_timestamp ON league_participants;
CREATE TRIGGER league_participants_update_timestamp 
    BEFORE UPDATE ON league_participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS league_formations_update_timestamp ON league_formations;
CREATE TRIGGER league_formations_update_timestamp 
    BEFORE UPDATE ON league_formations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS league_user_settings_update_timestamp ON league_user_settings;
CREATE TRIGGER league_user_settings_update_timestamp 
    BEFORE UPDATE ON league_user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

-- ===============================================
-- INDEXES FOR PERFORMANCE (Original + League System)
-- ===============================================

-- Original indexes
CREATE INDEX IF NOT EXISTS idx_user_players_user_id ON user_players(user_id);
CREATE INDEX IF NOT EXISTS idx_user_players_status ON user_players(status);
CREATE INDEX IF NOT EXISTS idx_master_players_ruolo ON master_players(ruolo);
CREATE INDEX IF NOT EXISTS idx_master_players_season ON master_players(season);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_players_user_id ON participant_players(user_id);
CREATE INDEX IF NOT EXISTS idx_formations_user_id ON formations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- League system indexes
CREATE INDEX IF NOT EXISTS idx_leagues_owner ON leagues(owner_id);
CREATE INDEX IF NOT EXISTS idx_leagues_code ON leagues(code);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);

CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);

CREATE INDEX IF NOT EXISTS idx_league_user_players_league_user ON league_user_players(league_id, user_id);
CREATE INDEX IF NOT EXISTS idx_league_user_players_master ON league_user_players(master_player_id);
CREATE INDEX IF NOT EXISTS idx_league_user_players_status ON league_user_players(status);

CREATE INDEX IF NOT EXISTS idx_league_participants_league_user ON league_participants(league_id, user_id);

CREATE INDEX IF NOT EXISTS idx_league_formations_league_user ON league_formations(league_id, user_id);

CREATE INDEX IF NOT EXISTS idx_league_user_settings_league_user ON league_user_settings(league_id, user_id);