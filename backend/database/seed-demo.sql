-- Demo data for FantaAiuto PostgreSQL database

-- Create demo user (password: demo123 -> bcrypt hash)
INSERT INTO users (username, email, password_hash, display_name, is_active) 
VALUES (
  'demo', 
  'demo@fantaaiuto.com', 
  '$2b$12$LQv3c1yqBwEHxv03NnzOXeLEiaCKCgFTyJhynkx9mRAaNhCiKZdXe', -- demo123
  'Demo User',
  true
) ON CONFLICT (username) DO NOTHING;

-- Create demo user settings
INSERT INTO user_settings (user_id, total_budget, max_players, roles_config) 
SELECT id, 500, 30, '{"Por":3,"Ds":2,"Dd":2,"Dc":2,"B":2,"E":2,"M":2,"C":2,"W":2,"T":2,"A":2,"Pc":2}'
FROM users WHERE username = 'demo'
ON CONFLICT (user_id) DO NOTHING;

-- Add some sample participants
INSERT INTO participants (user_id, name, squadra, budget_used) 
SELECT u.id, 'Mario Rossi', 'Team Rossi', 150
FROM users u WHERE u.username = 'demo'
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO participants (user_id, name, squadra, budget_used) 
SELECT u.id, 'Luigi Verdi', 'Team Verdi', 200
FROM users u WHERE u.username = 'demo'
ON CONFLICT (user_id, name) DO NOTHING;