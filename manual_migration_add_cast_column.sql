-- migration: manual_migration_add_cast_column.sql
-- description: Dodaje kolumnę cast do tabeli item_feedback dla obsługi metadanych obsady
-- author: ai assistant
-- date: 2025-05-20

-- Dodanie kolumny cast do tabeli item_feedback (jeśli nie istnieje)
ALTER TABLE public.item_feedback ADD COLUMN IF NOT EXISTS "cast" text;

-- Dodanie indeksu dla nowej kolumny, aby przyspieszyć wyszukiwanie
CREATE INDEX IF NOT EXISTS item_feedback_cast_idx ON public.item_feedback("cast");

-- Dodanie komentarza dla dokumentacji
COMMENT ON COLUMN public.item_feedback."cast" IS 'Aktorzy/obsada filmu oddzieleni przecinkami (bez spacji)';

-- Odświeżenie cache schematu
NOTIFY pgrst, 'reload schema';

-- Log informacyjny
DO $$
BEGIN
  RAISE NOTICE 'Kolumna cast została dodana do tabeli item_feedback';
END $$; 