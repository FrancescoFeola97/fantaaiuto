-- Migration: Update league_formations table structure
-- This script updates the league_formations table to match the expected schema

-- Check if the new columns exist, if not add them
DO $$ 
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'name') THEN
        ALTER TABLE league_formations ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT 'Formation';
    END IF;
    
    -- Add schema column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'schema') THEN
        ALTER TABLE league_formations ADD COLUMN schema VARCHAR(20) NOT NULL DEFAULT '4-3-3';
    END IF;
    
    -- Add players column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'players') THEN
        ALTER TABLE league_formations ADD COLUMN players TEXT DEFAULT '[]';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'is_active') THEN
        ALTER TABLE league_formations ADD COLUMN is_active BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'formation_id') THEN
        -- Migrate formation_id to schema if possible
        UPDATE league_formations SET schema = formation_id WHERE formation_id IS NOT NULL AND schema IS NULL;
        ALTER TABLE league_formations DROP COLUMN formation_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_formations' AND column_name = 'lineup_data') THEN
        -- Migrate lineup_data to players if possible  
        UPDATE league_formations SET players = lineup_data::text WHERE lineup_data IS NOT NULL AND players IS NULL;
        ALTER TABLE league_formations DROP COLUMN lineup_data;
    END IF;
    
END $$;

-- Update default values for existing rows
UPDATE league_formations SET 
    name = COALESCE(name, 'Formation ' || id),
    schema = COALESCE(schema, '4-3-3'),
    players = COALESCE(players, '[]'),
    is_active = COALESCE(is_active, FALSE)
WHERE name IS NULL OR schema IS NULL OR players IS NULL OR is_active IS NULL;

-- Remove the unique constraint that might conflict
DROP INDEX IF EXISTS league_formations_league_id_user_id_formation_id_key;