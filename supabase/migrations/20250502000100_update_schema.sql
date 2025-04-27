-- migration: 20250502000100_update_schema.sql
-- description: Drop unused tables (sessions, custom users), and update foreign key references to Supabase auth.users

-- Drop unused tables
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Cleanup orphaned records before foreign key updates
DELETE FROM music_preferences WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM film_preferences WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM recommendations WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM spotify_data WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM recommendations_feedback WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Update music_preferences to reference auth.users
DROP INDEX IF EXISTS music_preferences_user_id_idx;
ALTER TABLE music_preferences DROP CONSTRAINT IF EXISTS music_preferences_user_id_fkey;
ALTER TABLE music_preferences ADD CONSTRAINT music_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS music_preferences_user_id_idx ON music_preferences(user_id);

-- Update film_preferences to reference auth.users
DROP INDEX IF EXISTS film_preferences_user_id_idx;
ALTER TABLE film_preferences DROP CONSTRAINT IF EXISTS film_preferences_user_id_fkey;
ALTER TABLE film_preferences ADD CONSTRAINT film_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS film_preferences_user_id_idx ON film_preferences(user_id);

-- Update recommendations to reference auth.users
DROP INDEX IF EXISTS recommendations_user_id_idx;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS recommendations_user_id_idx ON recommendations(user_id);

-- Update spotify_data to reference auth.users
DROP INDEX IF EXISTS spotify_data_user_id_idx;
ALTER TABLE spotify_data DROP CONSTRAINT IF EXISTS spotify_data_user_id_fkey;
ALTER TABLE spotify_data ADD CONSTRAINT spotify_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS spotify_data_user_id_idx ON spotify_data(user_id);

-- Update recommendations_feedback to reference auth.users
DROP INDEX IF EXISTS recommendations_feedback_user_id_idx;
ALTER TABLE recommendations_feedback DROP CONSTRAINT IF EXISTS recommendations_feedback_user_id_fkey;
ALTER TABLE recommendations_feedback ADD CONSTRAINT recommendations_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS recommendations_feedback_user_id_idx ON recommendations_feedback(user_id); 