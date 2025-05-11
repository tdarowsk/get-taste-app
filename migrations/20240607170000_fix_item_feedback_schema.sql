-- migration: 20240607170000_fix_item_feedback_schema.sql
-- description: Fixes the item_feedback table schema and refreshes PostgREST cache
-- author: ai assistant
-- date: 2024-06-07

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.item_feedback;

-- Recreate the table with all required columns
CREATE TABLE public.item_feedback (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    genre TEXT,
    artist TEXT,
    "cast" TEXT,
    metadata JSONB DEFAULT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS item_feedback_user_id_idx ON public.item_feedback(user_id);
CREATE INDEX IF NOT EXISTS item_feedback_item_id_idx ON public.item_feedback(item_id);
CREATE INDEX IF NOT EXISTS item_feedback_feedback_type_idx ON public.item_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS item_feedback_genre_idx ON public.item_feedback(genre);
CREATE INDEX IF NOT EXISTS item_feedback_artist_idx ON public.item_feedback(artist);
CREATE INDEX IF NOT EXISTS item_feedback_cast_idx ON public.item_feedback("cast");
CREATE INDEX IF NOT EXISTS item_feedback_metadata_idx ON public.item_feedback USING GIN (metadata);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS item_feedback_unique_idx 
    ON public.item_feedback(user_id, item_id);

-- Add comments
COMMENT ON TABLE public.item_feedback IS 'Stores user feedback on specific items';
COMMENT ON COLUMN public.item_feedback.genre IS 'Genre associated with the item (music or movie)';
COMMENT ON COLUMN public.item_feedback.artist IS 'Artist/creator associated with the item (band, performer, director)';
COMMENT ON COLUMN public.item_feedback."cast" IS 'Cast members for movies';
COMMENT ON COLUMN public.item_feedback.metadata IS 'Additional structured metadata for the item';

-- Enable RLS
ALTER TABLE public.item_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "item_feedback_select_policy_for_authenticated"
    ON public.item_feedback
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

CREATE POLICY "item_feedback_insert_policy_for_authenticated"
    ON public.item_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "item_feedback_update_policy_for_authenticated"
    ON public.item_feedback
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Force RLS
ALTER TABLE public.item_feedback FORCE ROW LEVEL SECURITY;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema'; 