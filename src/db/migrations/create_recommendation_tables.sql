-- Tworzenie tabel i indeksów dla systemu rekomendacji
-- Uruchom ten skrypt w konsoli SQL Supabase

-- Tabela przechowująca rekomendacje
CREATE TABLE IF NOT EXISTS public.recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('music', 'film')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indeksy dla tabeli recommendations
CREATE INDEX IF NOT EXISTS recommendations_user_id_idx ON public.recommendations (user_id);
CREATE INDEX IF NOT EXISTS recommendations_type_idx ON public.recommendations (type);
CREATE INDEX IF NOT EXISTS recommendations_created_at_idx ON public.recommendations (created_at DESC);

-- Tabela przechowująca feedback użytkownika na temat rekomendacji
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id BIGINT NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indeksy dla tabeli recommendation_feedback
CREATE INDEX IF NOT EXISTS recommendation_feedback_user_id_idx ON public.recommendation_feedback (user_id);
CREATE INDEX IF NOT EXISTS recommendation_feedback_recommendation_id_idx ON public.recommendation_feedback (recommendation_id);
CREATE INDEX IF NOT EXISTS recommendation_feedback_feedback_type_idx ON public.recommendation_feedback (feedback_type);
CREATE INDEX IF NOT EXISTS recommendation_feedback_created_at_idx ON public.recommendation_feedback (created_at DESC);

-- Tabela śledząca wyświetlone rekomendacje, aby unikać powtórzeń
CREATE TABLE IF NOT EXISTS public.seen_recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  recommendation_id BIGINT NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('music', 'film')),
  feedback_type TEXT CHECK (feedback_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, item_id)
);

-- Indeksy dla tabeli seen_recommendations
CREATE INDEX IF NOT EXISTS seen_recommendations_user_id_idx ON public.seen_recommendations (user_id);
CREATE INDEX IF NOT EXISTS seen_recommendations_item_id_idx ON public.seen_recommendations (item_id);
CREATE INDEX IF NOT EXISTS seen_recommendations_recommendation_id_idx ON public.seen_recommendations (recommendation_id);
CREATE INDEX IF NOT EXISTS seen_recommendations_type_idx ON public.seen_recommendations (type);
CREATE INDEX IF NOT EXISTS seen_recommendations_created_at_idx ON public.seen_recommendations (created_at DESC);

-- Tabela preferencji użytkownika dla muzyki
CREATE TABLE IF NOT EXISTS public.music_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genres TEXT[] DEFAULT '{}',
  artists TEXT[] DEFAULT '{}',
  years TEXT[] DEFAULT '{}',
  tempos TEXT[] DEFAULT '{}',
  moods TEXT[] DEFAULT '{}',
  instruments TEXT[] DEFAULT '{}',
  language TEXT,
  themes TEXT[] DEFAULT '{}',
  popularity INTEGER CHECK (popularity BETWEEN 0 AND 10),
  variety INTEGER CHECK (variety BETWEEN 0 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Indeksy dla tabeli music_preferences
CREATE INDEX IF NOT EXISTS music_preferences_user_id_idx ON public.music_preferences (user_id);

-- Tabela preferencji użytkownika dla filmów
CREATE TABLE IF NOT EXISTS public.film_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genres TEXT[] DEFAULT '{}',
  directors TEXT[] DEFAULT '{}',
  actors TEXT[] DEFAULT '{}',
  years TEXT[] DEFAULT '{}',
  language TEXT,
  themes TEXT[] DEFAULT '{}',
  duration INTEGER,
  rating INTEGER CHECK (rating BETWEEN 0 AND 10),
  popularity INTEGER CHECK (popularity BETWEEN 0 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Indeksy dla tabeli film_preferences
CREATE INDEX IF NOT EXISTS film_preferences_user_id_idx ON public.film_preferences (user_id);

-- Policy do zabezpieczenia dostępu do danych (Row Level Security)
-- Użytkownik może zobaczyć i modyfikować tylko swoje dane

-- Włączenie RLS dla wszystkich tabel
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seen_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_preferences ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli recommendations
CREATE POLICY "Użytkownicy mogą czytać własne rekomendacje" 
  ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą tworzyć własne rekomendacje" 
  ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityki dla tabeli recommendation_feedback
CREATE POLICY "Użytkownicy mogą czytać własny feedback" 
  ON public.recommendation_feedback FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą tworzyć własny feedback" 
  ON public.recommendation_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityki dla tabeli seen_recommendations
CREATE POLICY "Użytkownicy mogą czytać własne widziane rekomendacje" 
  ON public.seen_recommendations FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą aktualizować własne widziane rekomendacje" 
  ON public.seen_recommendations FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą tworzyć własne widziane rekomendacje" 
  ON public.seen_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityki dla tabeli music_preferences
CREATE POLICY "Użytkownicy mogą czytać własne preferencje muzyczne" 
  ON public.music_preferences FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą aktualizować własne preferencje muzyczne" 
  ON public.music_preferences FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą tworzyć własne preferencje muzyczne" 
  ON public.music_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityki dla tabeli film_preferences
CREATE POLICY "Użytkownicy mogą czytać własne preferencje filmowe" 
  ON public.film_preferences FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą aktualizować własne preferencje filmowe" 
  ON public.film_preferences FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Użytkownicy mogą tworzyć własne preferencje filmowe" 
  ON public.film_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Funkcja do automatycznej aktualizacji pola updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla aktualizacji updated_at
CREATE TRIGGER update_music_preferences_updated_at
BEFORE UPDATE ON public.music_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_film_preferences_updated_at
BEFORE UPDATE ON public.film_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 