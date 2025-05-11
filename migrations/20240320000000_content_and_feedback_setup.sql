-- Migration: Content and Feedback System Setup
-- Version: 20240320000000
-- Description: Sets up the content mapping and feedback system with proper indexes and triggers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create movies mapping table
CREATE TABLE IF NOT EXISTS public.movies_mapping (
    movie_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    release_year TEXT,
    tmdb_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create recommendation feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT,
    content_type TEXT,
    feedback_type TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create item feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.item_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    cast TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_mapping_title ON public.movies_mapping(title);
CREATE INDEX IF NOT EXISTS idx_movies_mapping_tmdb_id ON public.movies_mapping(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_id ON public.recommendation_feedback(content_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_type ON public.recommendation_feedback(content_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_content ON public.recommendation_feedback(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_item_feedback_user_item ON public.item_feedback(user_id, item_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
    -- Movies mapping trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_movies_mapping_updated_at'
    ) THEN
        CREATE TRIGGER set_movies_mapping_updated_at
        BEFORE UPDATE ON public.movies_mapping
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- Recommendation feedback trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_recommendation_feedback_updated_at'
    ) THEN
        CREATE TRIGGER set_recommendation_feedback_updated_at
        BEFORE UPDATE ON public.recommendation_feedback
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- Item feedback trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_item_feedback_updated_at'
    ) THEN
        CREATE TRIGGER set_item_feedback_updated_at
        BEFORE UPDATE ON public.item_feedback
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    END IF;
END$$;

-- Create function to fetch movie title
CREATE OR REPLACE FUNCTION public.fetch_movie_title(movie_id TEXT)
RETURNS TEXT AS $$
DECLARE
    movie_title TEXT;
BEGIN
    SELECT title INTO movie_title FROM public.movies_mapping WHERE movie_id = $1;
    RETURN COALESCE(movie_title, movie_id);
END;
$$ LANGUAGE plpgsql;

-- Add table comments
COMMENT ON TABLE public.movies_mapping IS 'Maps movie IDs to their corresponding titles for recommendations';
COMMENT ON TABLE public.recommendation_feedback IS 'Stores user feedback on recommendations with content identifiers';
COMMENT ON TABLE public.item_feedback IS 'Stores user feedback on specific items';

-- Add column comments
COMMENT ON COLUMN public.recommendation_feedback.content_id IS 'External identifier for the content item (e.g., TMDB ID)';
COMMENT ON COLUMN public.recommendation_feedback.content_type IS 'Type of content (film, music, etc.)';
COMMENT ON COLUMN public.recommendation_feedback.feedback_type IS 'Type of feedback (like, dislike, neutral)';
COMMENT ON COLUMN public.item_feedback.cast IS 'Cast information for the item';

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_content_and_feedback_setup()
RETURNS void AS $$
BEGIN
    -- Drop triggers
    DROP TRIGGER IF EXISTS set_movies_mapping_updated_at ON public.movies_mapping;
    DROP TRIGGER IF EXISTS set_recommendation_feedback_updated_at ON public.recommendation_feedback;
    DROP TRIGGER IF EXISTS set_item_feedback_updated_at ON public.item_feedback;

    -- Drop functions
    DROP FUNCTION IF EXISTS public.set_updated_at();
    DROP FUNCTION IF EXISTS public.fetch_movie_title(TEXT);

    -- Drop tables
    DROP TABLE IF EXISTS public.movies_mapping;
    DROP TABLE IF EXISTS public.recommendation_feedback;
    DROP TABLE IF EXISTS public.item_feedback;
END;
$$ LANGUAGE plpgsql; 