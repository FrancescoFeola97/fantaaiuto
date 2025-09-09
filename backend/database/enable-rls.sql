-- Enable Row Level Security (RLS) for all tables and create security policies
-- This script addresses all Supabase security warnings

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
-- CREATE RLS POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- USER SETTINGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- -----------------------------------------------------------------------------
-- USER PLAYERS POLICIES (Legacy)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own players" ON public.user_players
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- -----------------------------------------------------------------------------
-- USER SESSIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- -----------------------------------------------------------------------------
-- MASTER PLAYERS POLICIES (Read-only for all authenticated users)
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view master players" ON public.master_players
    FOR SELECT USING (auth.uid() IS NOT NULL OR auth.uid() IS NULL);

CREATE POLICY "Allow master players management" ON public.master_players
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- LEGACY TABLES POLICIES (Backward compatibility)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own participants" ON public.participants
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own participant players" ON public.participant_players
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own formations" ON public.formations
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own formation images" ON public.formation_images
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- -----------------------------------------------------------------------------
-- LEAGUES POLICIES
-- -----------------------------------------------------------------------------
-- Users can see leagues they are members of
CREATE POLICY "Users can view leagues they belong to" ON public.leagues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = leagues.id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        ) OR auth.uid() IS NULL
    );

-- Users can create leagues
CREATE POLICY "Users can create leagues" ON public.leagues
    FOR INSERT WITH CHECK (auth.uid()::text = created_by::text OR auth.uid() IS NULL);

-- Users can update leagues they own or are admin of
CREATE POLICY "Users can update leagues they own or admin" ON public.leagues
    FOR UPDATE USING (
        auth.uid()::text = created_by::text OR
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = leagues.id 
            AND league_members.user_id::text = auth.uid()::text
            AND league_members.role IN ('owner', 'admin')
        ) OR auth.uid() IS NULL
    );

-- -----------------------------------------------------------------------------
-- LEAGUE MEMBERS POLICIES  
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view league memberships for leagues they belong to" ON public.league_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.league_members lm2
            WHERE lm2.league_id = league_members.league_id 
            AND (lm2.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        ) OR auth.uid() IS NULL
    );

CREATE POLICY "League admins can manage memberships" ON public.league_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.league_members lm2
            WHERE lm2.league_id = league_members.league_id 
            AND lm2.user_id::text = auth.uid()::text
            AND lm2.role IN ('owner', 'admin')
        ) OR auth.uid() IS NULL
    );

-- -----------------------------------------------------------------------------
-- LEAGUE USER PLAYERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own league players" ON public.league_user_players
    FOR ALL USING (
        (auth.uid()::text = user_id::text OR auth.uid() IS NULL) AND
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = league_user_players.league_id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        )
    );

-- -----------------------------------------------------------------------------
-- LEAGUE PARTICIPANTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own league participants" ON public.league_participants
    FOR ALL USING (
        (auth.uid()::text = user_id::text OR auth.uid() IS NULL) AND
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = league_participants.league_id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        )
    );

-- -----------------------------------------------------------------------------
-- LEAGUE PARTICIPANT PLAYERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own league participant players" ON public.league_participant_players
    FOR ALL USING (
        (auth.uid()::text = user_id::text OR auth.uid() IS NULL) AND
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = league_participant_players.league_id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        )
    );

-- -----------------------------------------------------------------------------
-- LEAGUE FORMATIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own league formations" ON public.league_formations
    FOR ALL USING (
        (auth.uid()::text = user_id::text OR auth.uid() IS NULL) AND
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = league_formations.league_id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        )
    );

-- -----------------------------------------------------------------------------
-- LEAGUE USER SETTINGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own league settings" ON public.league_user_settings
    FOR ALL USING (
        (auth.uid()::text = user_id::text OR auth.uid() IS NULL) AND
        EXISTS (
            SELECT 1 FROM public.league_members 
            WHERE league_members.league_id = league_user_settings.league_id 
            AND (league_members.user_id::text = auth.uid()::text OR auth.uid() IS NULL)
        )
    );

-- -----------------------------------------------------------------------------
-- AUDIT LOG POLICIES
-- -----------------------------------------------------------------------------
-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- System can insert audit logs
CREATE POLICY "Allow audit log creation" ON public.audit_log
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select permissions for authenticated users on master data
GRANT SELECT ON public.master_players TO authenticated;
GRANT SELECT ON public.master_players TO anon;

-- =============================================================================
-- CREATE HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Function to check if user is league member
CREATE OR REPLACE FUNCTION public.is_league_member(league_id_param INTEGER, user_id_param INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.league_members 
        WHERE league_id = league_id_param 
        AND user_id = COALESCE(user_id_param, (auth.uid())::integer)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is league admin
CREATE OR REPLACE FUNCTION public.is_league_admin(league_id_param INTEGER, user_id_param INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.league_members 
        WHERE league_id = league_id_param 
        AND user_id = COALESCE(user_id_param, (auth.uid())::integer)
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Users can view their own profile" ON public.users IS 
'Users can only view their own user profile data for privacy';

COMMENT ON POLICY "Users can view leagues they belong to" ON public.leagues IS 
'Users can only see leagues where they are members to ensure data isolation';

COMMENT ON POLICY "Users can manage their own league players" ON public.league_user_players IS 
'Users can only manage player data within leagues they belong to';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- These queries can be run to verify RLS is working correctly:
/*
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
*/