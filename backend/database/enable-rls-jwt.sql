-- Enable Row Level Security (RLS) for JWT-based authentication
-- This version is designed for your current JWT authentication system
-- Since you're not using Supabase Auth, we'll create permissive policies

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

-- User-related tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Master data tables (shared across all users)
ALTER TABLE public.master_players ENABLE ROW LEVEL SECURITY;

-- Legacy tables (for backward compatibility)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_images ENABLE ROW LEVEL SECURITY;

-- League-based tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_user_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_participant_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_user_settings ENABLE ROW LEVEL SECURITY;

-- Audit and logging
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE PERMISSIVE POLICIES FOR JWT AUTHENTICATION
-- =============================================================================
-- Since you're using custom JWT authentication through your Node.js backend,
-- we'll create policies that allow all operations from authenticated connections
-- The actual authorization is handled by your application layer

-- -----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
CREATE POLICY "Allow all operations on users" ON public.users
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- USER SETTINGS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on user_settings" ON public.user_settings;
CREATE POLICY "Allow all operations on user_settings" ON public.user_settings
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- USER PLAYERS POLICIES (Legacy)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on user_players" ON public.user_players;
CREATE POLICY "Allow all operations on user_players" ON public.user_players
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- USER SESSIONS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all operations on user_sessions" ON public.user_sessions
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- MASTER PLAYERS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on master_players" ON public.master_players;
CREATE POLICY "Allow all operations on master_players" ON public.master_players
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEGACY TABLES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on participants" ON public.participants;
CREATE POLICY "Allow all operations on participants" ON public.participants
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on participant_players" ON public.participant_players;
CREATE POLICY "Allow all operations on participant_players" ON public.participant_players
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on formations" ON public.formations;
CREATE POLICY "Allow all operations on formations" ON public.formations
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on formation_images" ON public.formation_images;
CREATE POLICY "Allow all operations on formation_images" ON public.formation_images
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on leagues" ON public.leagues;
CREATE POLICY "Allow all operations on leagues" ON public.leagues
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE MEMBERS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_members" ON public.league_members;
CREATE POLICY "Allow all operations on league_members" ON public.league_members
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE USER PLAYERS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_user_players" ON public.league_user_players;
CREATE POLICY "Allow all operations on league_user_players" ON public.league_user_players
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE PARTICIPANTS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_participants" ON public.league_participants;
CREATE POLICY "Allow all operations on league_participants" ON public.league_participants
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE PARTICIPANT PLAYERS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_participant_players" ON public.league_participant_players;
CREATE POLICY "Allow all operations on league_participant_players" ON public.league_participant_players
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE FORMATIONS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_formations" ON public.league_formations;
CREATE POLICY "Allow all operations on league_formations" ON public.league_formations
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEAGUE USER SETTINGS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on league_user_settings" ON public.league_user_settings;
CREATE POLICY "Allow all operations on league_user_settings" ON public.league_user_settings
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- AUDIT LOG POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on audit_log" ON public.audit_log;
CREATE POLICY "Allow all operations on audit_log" ON public.audit_log
    FOR ALL USING (true);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Allow all operations on users" ON public.users IS 
'Permissive policy for JWT-based authentication. Authorization handled by application layer.';

COMMENT ON POLICY "Allow all operations on leagues" ON public.leagues IS 
'Permissive policy for JWT-based authentication. League access controlled by application middleware.';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Check policies exist
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;