-- manual_fix_item_feedback.sql
-- description: Adds missing genre and artist columns to item_feedback table
-- author: ai assistant

-- Add columns if they don't exist
ALTER TABLE public.item_feedback ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE public.item_feedback ADD COLUMN IF NOT EXISTS artist text;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS item_feedback_genre_idx ON public.item_feedback(genre);
CREATE INDEX IF NOT EXISTS item_feedback_artist_idx ON public.item_feedback(artist);

-- Add comments for documentation
COMMENT ON COLUMN public.item_feedback.genre IS 'Genre associated with the item (music or movie)';
COMMENT ON COLUMN public.item_feedback.artist IS 'Artist/creator associated with the item (band, performer, director, cast, writer)';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 