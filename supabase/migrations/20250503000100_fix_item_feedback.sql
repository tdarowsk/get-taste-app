-- migration: 20250503000100_fix_item_feedback.sql
-- description: Fixes the item_feedback table which is needed for the recommendation feedback functionality
-- author: ai assistant
-- date: 2025-05-03

-- Drop existing item_feedback table if it exists
DROP TABLE IF EXISTS item_feedback;

-- item_feedback table 
CREATE TABLE IF NOT EXISTS item_feedback (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- user ID as string
    item_id TEXT NOT NULL, -- item ID (formatted string from recommendation items)
    feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- enable row level security on item_feedback table
ALTER TABLE item_feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes for item_feedback table
CREATE INDEX IF NOT EXISTS item_feedback_user_id_idx ON item_feedback(user_id);
CREATE INDEX IF NOT EXISTS item_feedback_item_id_idx ON item_feedback(item_id);
CREATE INDEX IF NOT EXISTS item_feedback_feedback_type_idx ON item_feedback(feedback_type);

-- add a unique constraint to prevent duplicate feedback for the same item
CREATE UNIQUE INDEX IF NOT EXISTS item_feedback_unique_idx 
    ON item_feedback(user_id, item_id);

-- RLS policies for item_feedback table
-- authenticated users can only see their own feedback
CREATE POLICY "item_feedback_select_policy_for_authenticated"
    ON item_feedback
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

-- authenticated users can only insert their own feedback
CREATE POLICY "item_feedback_insert_policy_for_authenticated"
    ON item_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

-- authenticated users can only update their own feedback
CREATE POLICY "item_feedback_update_policy_for_authenticated"
    ON item_feedback
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- anon users can't access feedback data
CREATE POLICY "item_feedback_select_policy_for_anon"
    ON item_feedback
    FOR SELECT
    TO anon
    USING (false);

-- Allow service role to bypass RLS (needed for API endpoints)
ALTER TABLE item_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_feedback FORCE ROW LEVEL SECURITY;

-- Create sample data for testing
INSERT INTO item_feedback (user_id, item_id, feedback_type, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'sample-item-1', 'like', now() - interval '7 days'),
    ('00000000-0000-0000-0000-000000000001', 'sample-item-2', 'dislike', now() - interval '6 days'),
    ('00000000-0000-0000-0000-000000000002', 'sample-item-3', 'like', now() - interval '5 days')
ON CONFLICT (user_id, item_id) DO NOTHING; 