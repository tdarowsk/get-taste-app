-- Plik do wykonania ręcznie w SQL Editor panelu Supabase
-- Dodanie kolumn genre i artist do tabeli item_feedback

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

-- Odświeżenie cache schematu - WAŻNE aby rozwiązać błąd!
notify pgrst, 'reload schema';

-- Potwierdzenie wykonania
select 'Kolumny genre i artist zostały dodane do tabeli item_feedback' as message;

-- Sprawdzenie czy kolumny istnieją
select 
  column_name, 
  data_type,
  is_nullable
from 
  information_schema.columns 
where 
  table_name = 'item_feedback' 
  and column_name in ('genre', 'artist'); 