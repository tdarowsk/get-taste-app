-- migration: 20250503000200_fix_preferences_rls.sql
-- description: Fixes the RLS policies for preferences tables (music_preferences and film_preferences)
-- author: ai assistant
-- date: 2025-05-03

-- Add updated_at columns to preference tables
ALTER TABLE music_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE film_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "music_preferences_select_policy_for_authenticated" ON music_preferences;
DROP POLICY IF EXISTS "music_preferences_insert_policy_for_authenticated" ON music_preferences;
DROP POLICY IF EXISTS "music_preferences_update_policy_for_authenticated" ON music_preferences;
DROP POLICY IF EXISTS "music_preferences_select_policy_for_anon" ON music_preferences;

DROP POLICY IF EXISTS "film_preferences_select_policy_for_authenticated" ON film_preferences;
DROP POLICY IF EXISTS "film_preferences_insert_policy_for_authenticated" ON film_preferences;
DROP POLICY IF EXISTS "film_preferences_update_policy_for_authenticated" ON film_preferences;
DROP POLICY IF EXISTS "film_preferences_select_policy_for_anon" ON film_preferences;

-- RLS policies for music_preferences table
-- authenticated users can only see their own music preferences
CREATE POLICY "music_preferences_select_policy_for_authenticated"
    ON music_preferences
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- authenticated users can only insert their own music preferences
CREATE POLICY "music_preferences_insert_policy_for_authenticated"
    ON music_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- authenticated users can only update their own music preferences
CREATE POLICY "music_preferences_update_policy_for_authenticated"
    ON music_preferences
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- anon users can't access music preferences
CREATE POLICY "music_preferences_select_policy_for_anon"
    ON music_preferences
    FOR SELECT
    TO anon
    USING (false);

-- RLS policies for film_preferences table
-- authenticated users can only see their own film preferences
CREATE POLICY "film_preferences_select_policy_for_authenticated"
    ON film_preferences
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- authenticated users can only insert their own film preferences
CREATE POLICY "film_preferences_insert_policy_for_authenticated"
    ON film_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- authenticated users can only update their own film preferences
CREATE POLICY "film_preferences_update_policy_for_authenticated"
    ON film_preferences
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- anon users can't access film preferences
CREATE POLICY "film_preferences_select_policy_for_anon"
    ON film_preferences
    FOR SELECT
    TO anon
    USING (false); 