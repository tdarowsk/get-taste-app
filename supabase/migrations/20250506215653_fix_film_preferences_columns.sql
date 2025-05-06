-- migration: 20250506215653_fix_film_preferences_columns.sql
-- description: Fixes the film_preferences table schema to ensure all required columns exist
-- author: ai assistant
-- date: 2025-05-06

-- First, check if all required columns exist and add them if they don't
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Add liked_movies column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'liked_movies'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN liked_movies TEXT[];
    END IF;

    -- Ensure the genres column exists and is properly typed
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'genres'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN genres TEXT[];
    END IF;

    -- Add other columns that might be missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'director'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN director TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'cast'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN "cast" TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'film_preferences' AND column_name = 'screenwriter'
    ) THEN
        ALTER TABLE public.film_preferences ADD COLUMN screenwriter TEXT;
    END IF;

    RAISE NOTICE 'Film preferences table columns have been updated';
END $$;

-- Make sure table has proper constraints
DO $$
BEGIN
    -- Check if the primary key constraint exists
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'film_preferences_pkey' AND conrelid = 'film_preferences'::regclass
    ) THEN
        -- The id column should handle this, but just in case
        ALTER TABLE public.film_preferences ADD PRIMARY KEY (id);
    END IF;

    -- Ensure user_id FK constraint exists
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'film_preferences_user_id_fkey' AND conrelid = 'film_preferences'::regclass
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.film_preferences 
        ADD CONSTRAINT film_preferences_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    RAISE NOTICE 'Film preferences table constraints have been updated';
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS film_preferences_user_id_idx ON film_preferences(user_id);
CREATE INDEX IF NOT EXISTS film_preferences_updated_at_idx ON film_preferences(updated_at);

-- Notify postgreSQL of the schema changes
NOTIFY pgrst, 'reload schema';
