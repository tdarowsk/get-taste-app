# Schemat Bazy Danych PostgreSQL dla getTaste MVP

## 1. Tabele i kolumny

### 1.1. Users
- **id**: UUID PRIMARY KEY DEFAULT auth.uid()
- **email**: VARCHAR(255) NOT NULL UNIQUE
- **password_hash**: VARCHAR(255) NOT NULL
- **nick**: VARCHAR(20) NOT NULL UNIQUE  
  CHECK (nick ~ '^[A-Za-z0-9_!]+$' AND char_length(nick) <= 20)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **deleted_at**: TIMESTAMPTZ NULL  -- mechanizm soft delete

### 1.2. User2FA
- **id**: SERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE
- **verification_code**: VARCHAR(20) NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **expires_at**: TIMESTAMPTZ NOT NULL
- **verified_at**: TIMESTAMPTZ NULL

### 1.3. Sessions
- **id**: SERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **token**: VARCHAR(255) NOT NULL UNIQUE
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 1.4. MusicPreferences
- **user_id**: UUID PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE
- **genres**: TEXT[]  -- lista gatunków muzycznych
- **artists**: TEXT[]  -- lista ulubionych artystów

### 1.5. FilmPreferences
- **user_id**: UUID PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE
- **genres**: TEXT[]  -- lista gatunków filmowych
- **director**: VARCHAR(255)  -- ulubiony reżyser
- **cast**: TEXT[]  -- lista ulubionych aktorów/obsada
- **screenwriter**: VARCHAR(255)  -- ulubiony scenarzysta

### 1.6. Recommendations
- **id**: SERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **type**: VARCHAR(10) NOT NULL  
  CHECK (type IN ('music', 'film'))
- **data**: JSONB NOT NULL  -- dane rekomendacji (np. lista polecanych pozycji)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 1.7. RecommendationsFeedback
- **id**: SERIAL PRIMARY KEY
- **recommendation_id**: INTEGER NOT NULL REFERENCES Recommendations(id) ON DELETE CASCADE
- **user_id**: UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **feedback_type**: VARCHAR(10) NOT NULL  
  CHECK (feedback_type IN ('like', 'dislike'))
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 1.8. SpotifyData
- **id**: SERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **album_id**: VARCHAR(50)  -- identyfikator albumu z API Spotify
- **artist_id**: VARCHAR(50)  -- identyfikator artysty z API Spotify
- **data**: JSONB  -- dodatkowe dane z API Spotify
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

## 2. Relacje między tabelami
- `Users` [1] — [1] `User2FA`
- `Users` [1] — [0..1] `MusicPreferences`
- `Users` [1] — [0..1] `FilmPreferences`
- `Users` [1] — [N] `Recommendations`
- `Users` [1] — [N] `RecommendationsFeedback`
- `Users` [1] — [N] `SpotifyData`
- `Recommendations` [1] — [N] `RecommendationsFeedback`

## 3. Indeksy
- Unikalny indeks na `Users.email`
- Unikalny indeks na `Users.nick`
- Unikalny indeks na `Sessions.token`
- Unikalny indeks na `RecommendationsFeedback` dla pary (`recommendation_id`, `user_id`)
- Indeksy na kolumnach `user_id` w tabelach: `User2FA`, `MusicPreferences`, `FilmPreferences`, `Recommendations`, `SpotifyData`, `RecommendationsFeedback`
- Indeks na kolumnie `recommendation_id` w tabeli `RecommendationsFeedback`
- Indeks na kolumnie `feedback_type` w tabeli `RecommendationsFeedback`
- Indeksy na kolumnach `album_id` i `artist_id` w tabeli `SpotifyData`
- Indeks na kolumnie `type` w tabeli `Recommendations`

## 4. Widoki i funkcje

### 4.1. Widok: recommendation_history
- Widok łączący tabele `Recommendations` i `RecommendationsFeedback`
- Umożliwia łatwy dostęp do historii przeglądania rekomendacji wraz z reakcjami użytkownika

### 4.2. Funkcja: get_recommendation_history
- Funkcja typu security-definer
- Przyjmuje parametr `user_uuid`
- Zwraca historię rekomendacji dla konkretnego użytkownika
- Zapewnia dodatkową warstwę bezpieczeństwa poprzez ograniczenie dostępu do danych

## 5. Zasady PostgreSQL i zabezpieczenia (RLS)
- **Row Level Security (RLS)**:  
  Wdrożenie polityk RLS na wszystkich tabelach zapewni, że użytkownicy mają dostęp wyłącznie do swoich danych. Szczegółowe polityki są zdefiniowane dla różnych operacji (select, insert, update) i ról (anon, authenticated).
- **Ograniczenia walidacyjne**:  
  - Pole `nick` w tabeli `Users` posiada CHECK wymuszający maksymalnie 20 znaków oraz użycie wyłącznie dozwolonych znaków ([A-Za-z0-9_!]).
  - Pole `type` w tabeli `Recommendations` może przyjmować tylko wartości 'music' lub 'film'.
  - Pole `feedback_type` w tabeli `RecommendationsFeedback` może przyjmować tylko wartości 'like' lub 'dislike'.
  - Pola NOT NULL oraz klucze obce zapewniają integralność danych.

## 6. Dane testowe
Przygotowane zostały dane testowe dla wszystkich tabel, obejmujące:
- 5 użytkowników z różnymi preferencjami muzycznymi i filmowymi
- Rekomendacje muzyczne i filmowe dopasowane do preferencji użytkowników
- Dane z API Spotify dla wybranych użytkowników
- Reakcje użytkowników na otrzymane rekomendacje (polubienia i niepolubienia)

Dane testowe są dostępne w postaci plików migracji SQL:
- `20250424001600_initial_schema.sql` - podstawowy schemat z minimalnymi danymi testowymi
- `20250430000100_create_recommendation_feedback.sql` - tabela feedbacku i początkowe reakcje
- `20250501000100_sample_test_data.sql` - dodatkowe dane testowe

## 7. Dodatkowe uwagi
- Mechanizm soft delete w tabeli `Users` umożliwia oznaczanie rekordów jako usunięte poprzez kolumnę `deleted_at`, zamiast trwałego usuwania.
- Typ danych UUID używany dla identyfikatorów użytkowników zapewnia lepszą integrację z systemem uwierzytelniania Supabase (auth.uid()).
- Zastosowanie typu `JSONB` w tabelach `Recommendations` i `SpotifyData` zapewnia elastyczność w przechowywaniu złożonych struktur danych.
- Struktura tabel pozwala na łatwą rozbudowę systemu rekomendacji w przyszłości, np. o dodatkowe typy rekomendacji czy bardziej zaawansowane algorytmy dopasowywania.
- Tabela `RecommendationsFeedback` umożliwia zbieranie reakcji użytkowników, co jest kluczowe dla doskonalenia systemu rekomendacji w przyszłych iteracjach produktu. 