# API Endpoint Implementation Plan: User Preferences API

## 1. Przegląd punktów końcowych

Implementacja pięciu endpointów zarządzających danymi profilowymi użytkownika oraz preferencjami muzycznymi i filmowymi:

1. **GET /users/{id}** - Pobieranie danych profilu użytkownika
2. **PATCH /users/{id}** - Aktualizacja podstawowych danych użytkownika
3. **GET /users/{id}/preferences** - Pobieranie połączonych preferencji muzycznych i filmowych
4. **PATCH /users/{id}/preferences/music** - Aktualizacja preferencji muzycznych
5. **PATCH /users/{id}/preferences/film** - Aktualizacja preferencji filmowych

Te endpointy umożliwią zarządzanie profilem użytkownika oraz jego preferencjami, co jest kluczowe dla generowania spersonalizowanych rekomendacji.

## 2. Szczegóły żądań

### GET /users/{id}

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users/{id}`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)

### PATCH /users/{id}

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/users/{id}`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)
- **Request Body**:
  ```json
  {
    "nick": "NewNickname"
  }
  ```

### GET /users/{id}/preferences

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users/{id}/preferences`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)

### PATCH /users/{id}/preferences/music

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/users/{id}/preferences/music`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)
- **Request Body**:
  ```json
  {
    "genres": ["rock", "pop"],
    "artists": ["Artist1", "Artist2"]
  }
  ```

### PATCH /users/{id}/preferences/film

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/users/{id}/preferences/film`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)
- **Request Body**:
  ```json
  {
    "genres": ["drama", "thriller"],
    "director": "Director Name",
    "cast": ["Actor1", "Actor2"],
    "screenwriter": "Writer Name"
  }
  ```

## 3. Wykorzystywane typy

### Istniejące typy

Z pliku `src/types.ts` wykorzystane zostaną:
- `UserProfileDTO`
- `UpdateUserCommand`
- `UserPreferencesDTO`
- `MusicPreferencesDTO`
- `UpdateMusicPreferencesCommand`
- `FilmPreferencesDTO`
- `UpdateFilmPreferencesCommand`

### Nowe typy i schematy walidacji

Należy zdefiniować w `src/lib/utils/validationSchemas.ts`:

```typescript
// Schemat walidacyjny dla aktualizacji profilu użytkownika
export const updateUserSchema = z.object({
  nick: z.string()
    .min(2, "Nick musi mieć co najmniej 2 znaki")
    .max(20, "Nick może mieć maksymalnie 20 znaków")
    .regex(/^[A-Za-z0-9_!]+$/, "Nick może zawierać tylko litery, cyfry, znak podkreślenia i wykrzyknik")
    .optional(),
});

// Schemat walidacyjny dla aktualizacji preferencji muzycznych
export const updateMusicPreferencesSchema = z.object({
  genres: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
});

// Schemat walidacyjny dla aktualizacji preferencji filmowych
export const updateFilmPreferencesSchema = z.object({
  genres: z.array(z.string()).optional(),
  director: z.string().nullable().optional(),
  cast: z.array(z.string()).optional(),
  screenwriter: z.string().nullable().optional(),
});
```

## 4. Szczegóły odpowiedzi

### GET /users/{id}

- **Sukces (200 OK)**:
  ```json
  {
    "id": 123,
    "email": "user@example.com",
    "nick": "UserNick",
    "created_at": "2023-07-15T12:00:00Z",
    "updated_at": "2023-07-15T12:00:00Z"
  }
  ```
- **Błąd (404 Not Found)**:
  ```json
  {
    "error": "Użytkownik nie istnieje"
  }
  ```
- **Błąd (401 Unauthorized)**:
  ```json
  {
    "error": "Brak autoryzacji"
  }
  ```

### PATCH /users/{id}

- **Sukces (200 OK)**:
  ```json
  {
    "id": 123,
    "email": "user@example.com",
    "nick": "NewNickname",
    "created_at": "2023-07-15T12:00:00Z",
    "updated_at": "2023-07-16T15:30:00Z"
  }
  ```
- **Błąd (400 Bad Request)**:
  ```json
  {
    "error": "Nieprawidłowe dane wejściowe",
    "details": { /* szczegóły błędów walidacji */ }
  }
  ```
- **Błąd (404 Not Found)**:
  ```json
  {
    "error": "Użytkownik nie istnieje"
  }
  ```
- **Błąd (403 Forbidden)**:
  ```json
  {
    "error": "Brak uprawnień do edycji tego użytkownika"
  }
  ```

### GET /users/{id}/preferences

- **Sukces (200 OK)**:
  ```json
  {
    "music": {
      "genres": ["rock", "pop"],
      "artists": ["Artist1", "Artist2"]
    },
    "film": {
      "genres": ["drama", "thriller"],
      "director": "Director Name",
      "cast": ["Actor1", "Actor2"],
      "screenwriter": "Writer Name"
    }
  }
  ```
- **Błąd (404 Not Found)**:
  ```json
  {
    "error": "Użytkownik nie istnieje"
  }
  ```
- **Błąd (401 Unauthorized)**:
  ```json
  {
    "error": "Brak autoryzacji"
  }
  ```

### PATCH /users/{id}/preferences/music

- **Sukces (200 OK)**:
  ```json
  {
    "genres": ["rock", "pop"],
    "artists": ["Artist1", "Artist2"]
  }
  ```
- **Błąd (400 Bad Request)**:
  ```json
  {
    "error": "Nieprawidłowe dane wejściowe",
    "details": { /* szczegóły błędów walidacji */ }
  }
  ```
- **Błąd (404 Not Found)**:
  ```json
  {
    "error": "Użytkownik nie istnieje"
  }
  ```

### PATCH /users/{id}/preferences/film

- **Sukces (200 OK)**:
  ```json
  {
    "genres": ["drama", "thriller"],
    "director": "Director Name",
    "cast": ["Actor1", "Actor2"],
    "screenwriter": "Writer Name"
  }
  ```
- **Błąd (400 Bad Request)**:
  ```json
  {
    "error": "Nieprawidłowe dane wejściowe",
    "details": { /* szczegóły błędów walidacji */ }
  }
  ```
- **Błąd (404 Not Found)**:
  ```json
  {
    "error": "Użytkownik nie istnieje"
  }
  ```

## 5. Przepływ danych

### Serwisy

Przed implementacją endpointów, należy stworzyć serwisy w `src/lib/services/`:

1. **UserService**:
   - `getUserProfile(userId: string)`: Pobieranie danych użytkownika
   - `updateUserProfile(userId: string, data: UpdateUserCommand)`: Aktualizacja danych użytkownika

2. **PreferencesService**:
   - `getUserPreferences(userId: string)`: Pobieranie połączonych preferencji
   - `updateMusicPreferences(userId: string, data: UpdateMusicPreferencesCommand)`: Aktualizacja preferencji muzycznych
   - `updateFilmPreferences(userId: string, data: UpdateFilmPreferencesCommand)`: Aktualizacja preferencji filmowych

### Przepływ danych dla każdego endpointu

#### GET /users/{id}
1. Walidacja parametru ID użytkownika
2. Uwierzytelnienie i autoryzacja
3. Pobieranie danych użytkownika przy użyciu UserService
4. Transformacja danych do UserProfileDTO i zwrócenie odpowiedzi

#### PATCH /users/{id}
1. Walidacja parametru ID użytkownika
2. Uwierzytelnienie i autoryzacja
3. Walidacja danych wejściowych przy użyciu Zod
4. Aktualizacja danych użytkownika przy użyciu UserService
5. Transformacja danych do UserProfileDTO i zwrócenie odpowiedzi

#### GET /users/{id}/preferences
1. Walidacja parametru ID użytkownika
2. Uwierzytelnienie i autoryzacja
3. Pobieranie preferencji przy użyciu PreferencesService
4. Zwrócenie odpowiedzi z połączonymi preferencjami

#### PATCH /users/{id}/preferences/music
1. Walidacja parametru ID użytkownika
2. Uwierzytelnienie i autoryzacja
3. Walidacja danych wejściowych przy użyciu Zod
4. Aktualizacja preferencji muzycznych przy użyciu PreferencesService
5. Zwrócenie zaktualizowanych preferencji

#### PATCH /users/{id}/preferences/film
1. Walidacja parametru ID użytkownika
2. Uwierzytelnienie i autoryzacja
3. Walidacja danych wejściowych przy użyciu Zod
4. Aktualizacja preferencji filmowych przy użyciu PreferencesService
5. Zwrócenie zaktualizowanych preferencji

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja
- Używanie tokenów JWT przechowywanych w cookie (`sb-token`)
- Weryfikacja tożsamości użytkownika poprzez Supabase
- Sprawdzanie czy zalogowany użytkownik ma uprawnienia do danego zasobu

### Walidacja danych
- Ścisła walidacja wszystkich danych wejściowych przy użyciu biblioteki Zod
- Walidacja zgodna z regułami biznesowymi i ograniczeniami bazy danych
- Zapobieganie atakom wstrzykiwania SQL poprzez użycie parametryzowanych zapytań Supabase

### Inne względy bezpieczeństwa
- Implementacja CORS dla ochrony przed atakami cross-origin
- Ustawienie odpowiednich nagłówków bezpieczeństwa
- Logowanie prób nieautoryzowanego dostępu

## 7. Obsługa błędów

### Potencjalne błędy
1. **Błędy walidacji**:
   - Nieprawidłowy format ID użytkownika
   - Nieprawidłowe dane w ciele żądania

2. **Błędy autoryzacji**:
   - Brak tokenu JWT
   - Nieprawidłowy token JWT
   - Użytkownik nie ma uprawnień do danego zasobu

3. **Błędy związane z danymi**:
   - Użytkownik nie istnieje
   - Konflikty unikalnych wartości (np. próba użycia istniejącego nicka)

4. **Błędy serwera**:
   - Błędy bazy danych
   - Nieoczekiwane wyjątki

### Standardowa struktura błędów
```json
{
  "error": "Krótki opis błędu",
  "details": { /* opcjonalne szczegóły błędu */ },
  "message": "Szczegółowy opis błędu (tylko dla błędów 500)"
}
```

## 8. Rozważania dotyczące wydajności

1. **Optymalizacja zapytań bazodanowych**:
   - Wykorzystanie odpowiednich indeksów w tabelach
   - Pobieranie tylko niezbędnych pól

2. **Cachowanie**:
   - Można rozważyć cachowanie często pobieranych preferencji użytkowników

3. **Monitorowanie wydajności**:
   - Śledzenie czasu odpowiedzi endpointów
   - Identyfikacja wąskich gardeł

## 9. Etapy wdrożenia

### 1. Implementacja serwisów
1. Utworzenie `src/lib/services/user.service.ts`
2. Utworzenie `src/lib/services/preferences.service.ts`
3. Dodanie schematów walidacji w `src/lib/utils/validationSchemas.ts`

### 2. Implementacja endpoint GET /users/{id}
1. Utwórz plik `src/pages/api/users/[id]/index.ts` dla obsługi GET/PATCH
2. Zaimplementuj metodę GET zgodnie z określonym przepływem danych

### 3. Implementacja endpoint PATCH /users/{id}
1. Dodaj metodę PATCH w tym samym pliku `src/pages/api/users/[id]/index.ts`
2. Zaimplementuj zgodnie z określonym przepływem danych

### 4. Implementacja endpoint GET /users/{id}/preferences
1. Utwórz plik `src/pages/api/users/[id]/preferences/index.ts`
2. Zaimplementuj metodę GET zgodnie z określonym przepływem danych

### 5. Implementacja endpoint PATCH /users/{id}/preferences/music
1. Utwórz plik `src/pages/api/users/[id]/preferences/music.ts`
2. Zaimplementuj metodę PATCH zgodnie z określonym przepływem danych

### 6. Implementacja endpoint PATCH /users/{id}/preferences/film
1. Utwórz plik `src/pages/api/users/[id]/preferences/film.ts`
2. Zaimplementuj metodę PATCH zgodnie z określonym przepływem danych


### 7. Dokumentacja
1. Aktualizacja dokumentacji API
2. Dodanie komentarzy JSDoc do kodu 