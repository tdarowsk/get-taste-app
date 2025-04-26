# Schemat Bazy Danych PostgreSQL dla getTaste MVP

## 1. Tabele i kolumny

### 1.1. Users
- **id**: SERIAL PRIMARY KEY
- **email**: VARCHAR(255) NOT NULL UNIQUE
- **password_hash**: VARCHAR(255) NOT NULL
- **nick**: VARCHAR(20) NOT NULL UNIQUE  
  CHECK (nick ~ '^[A-Za-z0-9_!]+$' AND char_length(nick) <= 20)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **deleted_at**: TIMESTAMPTZ NULL  -- mechanizm soft delete

### 1.2. User2FA
- **id**: SERIAL PRIMARY KEY
- **user_id**: INTEGER NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE
- **verification_code**: VARCHAR(20) NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **expires_at**: TIMESTAMPTZ NOT NULL
- **verified_at**: TIMESTAMPTZ NULL

### 1.3. Sessions
- **id**: SERIAL PRIMARY KEY
- **token**: VARCHAR(255) NOT NULL UNIQUE
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 1.4. MusicPreferences
- **user_id**: INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE
- **genres**: TEXT[]  -- lista gatunków muzycznych
- **artists**: TEXT[]  -- lista ulubionych artystów

### 1.5. FilmPreferences
- **user_id**: INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE
- **genres**: TEXT[]  -- lista gatunków filmowych
- **director**: VARCHAR(255)  -- ulubiony reżyser
- **cast**: TEXT[]  -- lista ulubionych aktorów/obsada
- **screenwriter**: VARCHAR(255)  -- ulubiony scenarzysta

### 1.6. Recommendations
- **id**: SERIAL PRIMARY KEY
- **user_id**: INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **type**: VARCHAR(10) NOT NULL  
  CHECK (type IN ('music', 'film'))
- **data**: JSONB NOT NULL  -- dane rekomendacji (np. lista polecanych pozycji)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 1.7. SpotifyData
- **id**: SERIAL PRIMARY KEY
- **user_id**: INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE
- **album_id**: VARCHAR(50)  -- identyfikator albumu z API Spotify
- **artist_id**: VARCHAR(50)  -- identyfikator artysty z API Spotify
- **data**: JSONB  -- dodatkowe dane z API Spotify
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

## 2. Relacje między tabelami
- `Users` [1] — [1] `User2FA`
- `Users` [1] — [0..1] `MusicPreferences`
- `Users` [1] — [0..1] `FilmPreferences`
- `Users` [1] — [N] `Recommendations`
- `Users` [1] — [N] `SpotifyData`

## 3. Indeksy
- Unikalny indeks na `Users.email`
- Unikalny indeks na `Users.nick`
- Unikalny indeks na `Sessions.token`
- Indeksy na kolumnach `user_id` w tabelach: `User2FA`, `MusicPreferences`, `FilmPreferences`, `Recommendations`, `SpotifyData`

## 4. Zasady PostgreSQL i zabezpieczenia (RLS)
- **Row Level Security (RLS)**:  
  Wdrożenie polityk RLS na tabelach (np. `Users`, `Sessions`, `Recommendations`) zapewni, że użytkownicy mają dostęp wyłącznie do swoich danych. Szczegółowe polityki będą definiowane w zależności od ról (np. użytkownik vs. administrator).
- **Ograniczenia walidacyjne**:  
  - Pole `nick` w tabeli `Users` posiada CHECK wymuszający maksymalnie 20 znaków oraz użycie wyłącznie dozwolonych znaków ([A-Za-z0-9_!]).
  - Pola NOT NULL oraz klucze obce zapewniają integralność danych.

## 5. Dodatkowe uwagi
- Mechanizm soft delete w tabeli `Users` umożliwia oznaczanie rekordów jako usunięte poprzez kolumnę `deleted_at`, zamiast trwałego usuwania.
- Tabela `Sessions` została zaprojektowana jako minimalna, z możliwością przyszłej rozbudowy o dodatkowe atrybuty.
- Struktury dedykowanych tabel dla preferencji (muzycznych i filmowych) oraz rekomendacji pozwalają na elastyczne rozszerzenie funkcjonalności w przyszłych iteracjach.
- Zastosowanie typu `JSONB` w tabelach `Recommendations` i `SpotifyData` zapewnia elastyczność w przechowywaniu danych zewnętrznych API (np. Spotify). 