-- FantaAiuto Multi-User Database Schema

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- User settings (budget, max players, etc.)
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_budget INTEGER DEFAULT 500,
    max_players INTEGER DEFAULT 30,
    roles_config TEXT, -- JSON string with role limits
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Master players list (shared across all users, updated from Excel imports)
CREATE TABLE IF NOT EXISTS master_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    squadra VARCHAR(100),
    ruolo VARCHAR(10) NOT NULL,
    prezzo INTEGER,
    fvm INTEGER DEFAULT 0,
    season VARCHAR(10) DEFAULT '2024-25',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nome, squadra, season)
);

-- User-specific player data (ownership, interest, status per user)
CREATE TABLE IF NOT EXISTS user_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    master_player_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'owned', 'removed', 'interesting'
    interessante BOOLEAN DEFAULT FALSE,
    rimosso BOOLEAN DEFAULT FALSE,
    costo_reale INTEGER DEFAULT 0,
    data_acquisto DATETIME,
    data_rimozione DATETIME,
    tier VARCHAR(20), -- 'Top', 'Titolari', 'Low cost', etc.
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (master_player_id) REFERENCES master_players(id) ON DELETE CASCADE,
    UNIQUE(user_id, master_player_id)
);

-- League participants (other fantasy players)
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    budget_used INTEGER DEFAULT 0,
    players_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Players owned by other participants
CREATE TABLE IF NOT EXISTS participant_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, -- The user who tracks this info
    participant_id INTEGER NOT NULL,
    master_player_id INTEGER NOT NULL,
    costo_altri INTEGER DEFAULT 0,
    data_acquisto DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (master_player_id) REFERENCES master_players(id) ON DELETE CASCADE,
    UNIQUE(user_id, participant_id, master_player_id)
);

-- User formations
CREATE TABLE IF NOT EXISTS formations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    schema VARCHAR(20) NOT NULL, -- e.g., "4-3-3", "3-5-2"
    players TEXT, -- JSON array of player IDs
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Formation images
CREATE TABLE IF NOT EXISTS formation_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log for important actions
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better performance
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