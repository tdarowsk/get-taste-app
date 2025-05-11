ALTER TABLE public.item_feedback
ADD COLUMN IF NOT EXISTS artist TEXT;

COMMENT ON COLUMN public.item_feedback.artist IS 'Artist for music feedback (if applicable)'; 