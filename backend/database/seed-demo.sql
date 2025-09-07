-- Demo data for FantaAiuto PostgreSQL database

-- Delete existing demo user first (to handle conflicts)
DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE username = 'demo');
DELETE FROM participants WHERE user_id IN (SELECT id FROM users WHERE username = 'demo');
DELETE FROM users WHERE username = 'demo';

-- Create demo user (password: demo123 -> bcrypt hash)
INSERT INTO users (username, email, password_hash, display_name, is_active, created_at, updated_at) 
VALUES (
  'demo', 
  'demo@fantaaiuto.com', 
  '$2a$12$qGm1rnwpW4KB8tpsQ5d27OY16Bj6ofgwWVSwv2Iae5F1mNtEdHCwu', -- demo123 (verified hash)
  'Demo User',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create demo user settings  
INSERT INTO user_settings (user_id, total_budget, max_players, roles_config, created_at, updated_at) 
SELECT id, 500, 30, '{"Por":3,"Ds":2,"Dd":2,"Dc":2,"B":2,"E":2,"M":2,"C":2,"W":2,"T":2,"A":2,"Pc":2}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users WHERE username = 'demo';

-- Add some sample participants
INSERT INTO participants (user_id, name, squadra, budget_used, created_at, updated_at) 
SELECT u.id, 'Mario Rossi', 'Team Rossi', 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.username = 'demo';

INSERT INTO participants (user_id, name, squadra, budget_used, created_at, updated_at) 
SELECT u.id, 'Luigi Verdi', 'Team Verdi', 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.username = 'demo';