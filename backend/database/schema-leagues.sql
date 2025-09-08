-- FantaAiuto League System Database Schema
-- Multi-league support with complete data isolation

-- Leagues table: Core league information
CREATE TABLE leagues (
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
CREATE TABLE league_members (
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

-- League-specific user players (replaces user_players)
CREATE TABLE league_user_players (
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

-- League-specific participants (replaces participants)
CREATE TABLE league_participants (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budget_used INTEGER DEFAULT 0,
    players_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League-specific participant players (replaces participant_players)
CREATE TABLE league_participant_players (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES league_participants(id) ON DELETE CASCADE,
    master_player_id INTEGER NOT NULL REFERENCES master_players(id) ON DELETE CASCADE,
    costo_altri INTEGER DEFAULT 0,
    data_acquisto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League-specific formations (replaces formations if they exist)
CREATE TABLE league_formations (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    formation_id VARCHAR(50) NOT NULL, -- e.g., "4-3-3", "3-5-2"
    lineup_data JSONB NOT NULL, -- Stores the formation lineup as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, user_id, formation_id) -- Each user can have one lineup per formation per league
);

-- League-specific settings (per user, per league)
CREATE TABLE league_user_settings (
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

-- Indexes for performance
CREATE INDEX idx_leagues_owner ON leagues(owner_id);
CREATE INDEX idx_leagues_code ON leagues(code);
CREATE INDEX idx_leagues_status ON leagues(status);

CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);

CREATE INDEX idx_league_user_players_league_user ON league_user_players(league_id, user_id);
CREATE INDEX idx_league_user_players_master ON league_user_players(master_player_id);
CREATE INDEX idx_league_user_players_status ON league_user_players(status);

CREATE INDEX idx_league_participants_league_user ON league_participants(league_id, user_id);

CREATE INDEX idx_league_formations_league_user ON league_formations(league_id, user_id);

CREATE INDEX idx_league_user_settings_league_user ON league_user_settings(league_id, user_id);

-- Function to generate unique league codes
CREATE OR REPLACE FUNCTION generate_league_code() RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        code := UPPER(
            substring(
                md5(random()::text || clock_timestamp()::text) 
                from 1 for 6
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM leagues WHERE leagues.code = code) INTO exists;
        
        IF NOT exists THEN
            RETURN code;
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

CREATE TRIGGER leagues_update_timestamp 
    BEFORE UPDATE ON leagues 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER league_user_players_update_timestamp 
    BEFORE UPDATE ON league_user_players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER league_participants_update_timestamp 
    BEFORE UPDATE ON league_participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER league_formations_update_timestamp 
    BEFORE UPDATE ON league_formations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER league_user_settings_update_timestamp 
    BEFORE UPDATE ON league_user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp();