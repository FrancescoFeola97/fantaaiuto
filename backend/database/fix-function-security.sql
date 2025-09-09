-- Fix database function security warnings by setting search_path
-- This addresses Supabase security warnings about mutable search_path

-- =============================================================================
-- SECURE DATABASE FUNCTIONS WITH FIXED search_path
-- =============================================================================

-- Drop existing functions to recreate them with security fixes
DROP FUNCTION IF EXISTS public.generate_league_code() CASCADE;
DROP FUNCTION IF EXISTS public.set_league_code() CASCADE; 
DROP FUNCTION IF EXISTS public.add_league_owner_as_master() CASCADE;
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;

-- -----------------------------------------------------------------------------
-- 1. GENERATE_LEAGUE_CODE - Generates unique league codes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_league_code()
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SECURITY DEFINER
-- Fix: Set immutable search_path for security
SET search_path = 'public'
AS $function$
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
        
        -- Check if code already exists in leagues table
        SELECT EXISTS(
            SELECT 1 FROM public.leagues WHERE code = new_code
        ) INTO code_exists;
        
        -- Exit loop if unique code found
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.generate_league_code() IS 
'Generates unique 6-character alphanumeric league codes. Security: search_path fixed to public schema.';

-- -----------------------------------------------------------------------------
-- 2. SET_LEAGUE_CODE - Trigger function to set league codes automatically
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_league_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Fix: Set immutable search_path for security
SET search_path = 'public'
AS $function$
BEGIN
    -- Set league code if not provided
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := public.generate_league_code();
    END IF;
    RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.set_league_code() IS 
'Trigger function to automatically generate league codes when not provided. Security: search_path fixed to public schema.';

-- -----------------------------------------------------------------------------
-- 3. ADD_LEAGUE_OWNER_AS_MASTER - Automatically adds league creator as master
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_league_owner_as_master()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Fix: Set immutable search_path for security  
SET search_path = 'public'
AS $function$
BEGIN
    -- Add league owner as master member
    INSERT INTO public.league_members (league_id, user_id, role, team_name, joined_at)
    VALUES (NEW.id, NEW.owner_id, 'master', 'My Team', CURRENT_TIMESTAMP);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to add league owner as master: %', SQLERRM;
        RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.add_league_owner_as_master() IS 
'Trigger function to automatically add league creator as master member. Security: search_path fixed to public schema.';

-- -----------------------------------------------------------------------------
-- 4. UPDATE_TIMESTAMP - Generic timestamp update trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Fix: Set immutable search_path for security
SET search_path = 'public'
AS $function$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_timestamp() IS 
'Generic trigger function to update updated_at timestamps. Security: search_path fixed to public schema.';

-- =============================================================================
-- RECREATE TRIGGERS THAT USE THESE FUNCTIONS
-- =============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_league_code_trigger ON public.leagues;
DROP TRIGGER IF EXISTS add_league_owner_trigger ON public.leagues;
DROP TRIGGER IF EXISTS update_leagues_timestamp ON public.leagues;
DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON public.user_settings;

-- Recreate triggers with secure functions
CREATE TRIGGER set_league_code_trigger
    BEFORE INSERT ON public.leagues
    FOR EACH ROW
    EXECUTE FUNCTION public.set_league_code();

CREATE TRIGGER add_league_owner_trigger  
    AFTER INSERT ON public.leagues
    FOR EACH ROW
    EXECUTE FUNCTION public.add_league_owner_as_master();

-- Add timestamp triggers for common tables
CREATE TRIGGER update_leagues_timestamp
    BEFORE UPDATE ON public.leagues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW  
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- GRANT APPROPRIATE PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_league_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_league_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_league_owner_as_master() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO authenticated;

-- Grant to anon for public access (league code generation might be needed)
GRANT EXECUTE ON FUNCTION public.generate_league_code() TO anon;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check that functions are recreated with proper security settings
-- SELECT p.proname, p.prosecdef, p.proacl 
-- FROM pg_proc p 
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
-- AND p.proname IN ('generate_league_code', 'set_league_code', 'add_league_owner_as_master', 'update_timestamp')
-- ORDER BY p.proname;

-- Check triggers are properly recreated  
-- SELECT t.tgname, c.relname, p.proname
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE c.relname IN ('leagues', 'users', 'user_settings')
-- AND p.proname IN ('generate_league_code', 'set_league_code', 'add_league_owner_as_master', 'update_timestamp')
-- ORDER BY c.relname, t.tgname;