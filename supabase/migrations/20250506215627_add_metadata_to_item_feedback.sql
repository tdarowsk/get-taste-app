-- migration: 20250506215627_add_metadata_to_item_feedback.sql
-- description: Adds metadata column to item_feedback table to store detailed movie information
-- author: ai assistant
-- date: 2025-05-06

-- Add metadata column to item_feedback table (if it doesn't exist)
ALTER TABLE public.item_feedback ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add an index for the new column to improve search performance
CREATE INDEX IF NOT EXISTS item_feedback_metadata_idx ON public.item_feedback USING GIN (metadata);

-- Add documentation comment for the column
COMMENT ON COLUMN public.item_feedback.metadata IS 'Additional structured metadata for the item (genres, director, cast, etc.)';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Log information for tracking
DO $$
BEGIN
  RAISE NOTICE 'metadata column has been added to the item_feedback table';
END $$;
