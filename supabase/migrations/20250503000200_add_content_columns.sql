-- migration: 20250503000200_add_content_columns.sql
-- description: adds content_id and content_type columns to recommendation_feedback table
-- date: 2025-05-03

-- First check if columns exist before adding them (idempotent migration)
DO $$
BEGIN
    -- Check if the recommendation_feedback table exists, rename it from recommendations_feedback if needed
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recommendation_feedback'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recommendations_feedback'
    ) THEN
        ALTER TABLE public.recommendations_feedback RENAME TO recommendation_feedback;
    END IF;

    -- Check for content_id column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'recommendation_feedback' AND column_name = 'content_id'
    ) THEN
        ALTER TABLE public.recommendation_feedback ADD COLUMN content_id text;
    END IF;

    -- Check for content_type column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'recommendation_feedback' AND column_name = 'content_type'
    ) THEN
        ALTER TABLE public.recommendation_feedback ADD COLUMN content_type text;
    END IF;

END$$;

-- Add appropriate indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_id ON public.recommendation_feedback(content_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_type ON public.recommendation_feedback(content_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_content ON public.recommendation_feedback(user_id, content_type);

-- Update documentation comment on the table
COMMENT ON TABLE public.recommendation_feedback IS 'Stores user feedback on recommendations with content identifiers';
COMMENT ON COLUMN public.recommendation_feedback.content_id IS 'External identifier for the content item (e.g., TMDB ID)';
COMMENT ON COLUMN public.recommendation_feedback.content_type IS 'Type of content (film, music, etc.)'; 