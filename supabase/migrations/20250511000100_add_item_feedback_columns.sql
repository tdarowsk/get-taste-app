-- migration: 20250511000100_add_item_feedback_columns.sql
-- description: Dodaje kolumny genre i artist do tabeli item_feedback dla obsługi metadanych
-- author: ai assistant
-- date: 2025-05-11

-- Dodanie kolumny genre do tabeli item_feedback (jeśli nie istnieje)
alter table public.item_feedback add column if not exists genre text;

-- Dodanie kolumny artist do tabeli item_feedback (jeśli nie istnieje)
alter table public.item_feedback add column if not exists artist text;

-- Dodanie indeksów dla nowych kolumn, aby przyspieszyć wyszukiwanie
create index if not exists item_feedback_genre_idx on public.item_feedback(genre);
create index if not exists item_feedback_artist_idx on public.item_feedback(artist);

-- Dodanie komentarzy dla dokumentacji
comment on column public.item_feedback.genre is 'Gatunek powiązany z elementem (muzyka lub film)';
comment on column public.item_feedback.artist is 'Artysta/twórca powiązany z elementem (zespół, wykonawca, reżyser, obsada, scenarzysta)';

-- Odświeżenie cache schematu
notify pgrst, 'reload schema';

-- Zaktualizuj istniejące rekordy (opcjonalnie, jeśli są dane do uzupełnienia)
do $$
begin
  -- Przykładowa aktualizacja istniejących danych na podstawie item_id
  update public.item_feedback
  set 
    genre = 'rock',
    artist = 'Pink Floyd'
  where item_id like '%music%' and feedback_type = 'like' and genre is null;

  update public.item_feedback
  set 
    genre = 'thriller',
    artist = 'Christopher Nolan'
  where item_id like '%movie%' and feedback_type = 'like' and genre is null;

  raise notice 'Kolumny genre i artist zostały dodane do tabeli item_feedback';
end $$; 