# API Endpoint Implementation Plan: Spotify Integration API

## 1. Przegląd punktów końcowych

Implementacja dwóch endpointów integracji z platformą Spotify:

1. **POST /spotify/sync** - Inicjuje synchronizację z platformą Spotify w celu aktualizacji danych użytkownika (np. albumy, artyści) dla wzbogacenia rekomendacji.
2. **GET /users/{id}/spotify** - Pobiera najnowsze dane Spotify dla użytkownika.

Te endpointy są kluczowe dla procesu wzbogacania profilu muzycznego użytkownika, co pozwala na dostarczanie bardziej trafnych rekomendacji muzycznych.

## 2. Szczegóły żądań

### POST /spotify/sync

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/spotify/sync`
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)
- **Parametry**:
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body**:
  ```json
  {
    "user_id": 123
  }
  ```

### GET /users/{id}/spotify

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/users/{id}/spotify`
- **Parametry URL**:
  - Wymagane: `id` (UUID użytkownika)
- **Nagłówki**:
  - `Authorization` (Cookie `sb-token`)
- **Parametry Query**:
  - Opcjonalne: `limit` (liczba rekordów do pobrania, domyślnie 10)
  - Opcjonalne: `offset` (przesunięcie dla paginacji, domyślnie 0)

## 3. Wykorzystywane typy

### Z pliku src/types.ts:

```typescript
/** Command Model for initiating a Spotify synchronization (POST /spotify/sync) */
export interface SpotifySyncCommand {
  user_id: number;
}

/** DTO for Spotify data (from spotify_data table, GET /users/{id}/spotify) */
export interface SpotifyDataDTO {
  id: number;
  user_id: number;
  album_id: string | null;
  artist_id: string | null;
  data: SpotifyDataDetails; // Zmienione z 'any' na konkretny typ
  created_at: string;
}

// Nowy typ definiujący szczegółową strukturę danych Spotify
export interface SpotifyDataDetails {
  album_name?: string;
  artist_name?: string;
  genres?: string[];
  popularity?: number;
  release_date?: string;
  tracks?: SpotifyTrack[];
  // Inne pola zgodnie z potrzebami aplikacji
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
}

// Typ odpowiedzi dla POST /spotify/sync
export interface SpotifySyncResponseDTO {
  message: string;
  status: 'success' | 'error';
  details?: string;
}

// Typ odpowiedzi dla GET /users/{id}/spotify
export interface SpotifyDataListResponseDTO {
  data: SpotifyDataDTO[];
  count: number;
  limit: number;
  offset: number;
}
```

## 4. Szczegóły odpowiedzi

### POST /spotify/sync

- **Kod statusu**: 200 OK
- **Format odpowiedzi**:
  ```json
  {
    "message": "Synchronizacja z Spotify rozpoczęta",
    "status": "success"
  }
  ```

- **Kody błędów**:
  - 400 Bad Request - Nieprawidłowe dane wejściowe
  - 401 Unauthorized - Brak autoryzacji
  - 403 Forbidden - Brak uprawnień do żądanego zasobu
  - 500 Internal Server Error - Błąd serwera

### GET /users/{id}/spotify

- **Kod statusu**: 200 OK
- **Format odpowiedzi**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "user_id": 123,
        "album_id": "spotify_album_id",
        "artist_id": "spotify_artist_id",
        "data": {
          "album_name": "Album Title",
          "artist_name": "Artist Name",
          "genres": ["Rock", "Alternative"],
          "popularity": 85,
          "release_date": "2023-04-15",
          "tracks": [
            {
              "id": "track_id",
              "name": "Track Title",
              "duration_ms": 240000,
              "explicit": false,
              "preview_url": "https://spotify.com/preview/track_id"
            }
          ]
        },
        "created_at": "2023-05-20T10:30:45Z"
      }
    ],
    "count": 5,
    "limit": 10,
    "offset": 0
  }
  ```

- **Kody błędów**:
  - 401 Unauthorized - Brak autoryzacji
  - 403 Forbidden - Brak uprawnień do żądanego zasobu
  - 404 Not Found - Nie znaleziono danych dla podanego użytkownika
  - 500 Internal Server Error - Błąd serwera

## 5. Przepływ danych

### POST /spotify/sync

1. Endpoint otrzymuje żądanie z identyfikatorem użytkownika.
2. Sprawdzane jest istnienie i uprawnienia użytkownika.
3. Tworzone jest asynchroniczne zadanie synchronizacji z Spotify:
   - Pobiera dane profilu użytkownika z Spotify API
   - Mapuje dane do formatu wymaganego przez aplikację
   - Zapisuje/aktualizuje dane w tabeli `spotify_data`
4. Zwracany jest komunikat potwierdzający rozpoczęcie synchronizacji.

### GET /users/{id}/spotify

1. Endpoint otrzymuje żądanie z identyfikatorem użytkownika oraz opcjonalnymi parametrami paginacji.
2. Sprawdzane jest istnienie i uprawnienia użytkownika.
3. Pobierane są dane z tabeli `spotify_data` dla danego użytkownika z uwzględnieniem paginacji.
4. Dane są mapowane do formatu DTO i zwracane w odpowiedzi.

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja

- Obie operacje wymagają uwierzytelnienia przez token JWT.
- Supabase RLS (Row Level Security) zapewnia, że użytkownicy mają dostęp tylko do swoich danych.
- Endpoint GET /users/{id}/spotify powinien weryfikować, czy zalogowany użytkownik ma uprawnienia do żądanych danych (tylko własne dane lub rola administratora).
- POST /spotify/sync może być chroniony dodatkowymi ograniczeniami częstotliwości (rate limiting) aby zapobiec nadużyciom.

### Bezpieczne przetwarzanie danych

- Wszystkie dane wejściowe muszą być walidowane przez Zod według schematów.
- Zapytania do bazy danych powinny być parametryzowane aby zapobiec SQL injection.
- Implementacja middleware do sanityzacji danych wyjściowych.

## 7. Obsługa błędów

### POST /spotify/sync

1. Walidacja identyfikatora użytkownika - 400 Bad Request jeśli nieprawidłowy.
2. Weryfikacja autoryzacji - 401 Unauthorized jeśli brak autoryzacji.
3. Weryfikacja uprawnień - 403 Forbidden jeśli brak uprawnień.
4. Błędy połączenia z API Spotify - 500 Internal Server Error.
5. Błędy zapisu do bazy danych - 500 Internal Server Error.

### GET /users/{id}/spotify

1. Walidacja identyfikatora użytkownika - 400 Bad Request jeśli nieprawidłowy.
2. Weryfikacja autoryzacji - 401 Unauthorized jeśli brak autoryzacji.
3. Weryfikacja uprawnień - 403 Forbidden jeśli brak uprawnień.
4. Brak wyników dla użytkownika - 404 Not Found.
5. Błędy bazy danych - 500 Internal Server Error.

## 8. Rozważania dotyczące wydajności

1. **Paginacja** - Endpoint GET /users/{id}/spotify wspiera paginację wyników.
2. **Indeksowanie** - Tabela `spotify_data` ma indeksy na kolumnach `user_id`, `album_id` i `artist_id`.
3. **Asynchroniczne przetwarzanie** - Endpoint POST /spotify/sync inicjuje proces w tle, aby nie blokować odpowiedzi HTTP.
4. **Buforowanie** - Można rozważyć buforowanie danych Spotify w Redis lub podobnym rozwiązaniu:
   - Klucz bufora mógłby być zbudowany jako `spotify:{user_id}:{offset}:{limit}`
   - TTL bufora: 10-30 minut (w zależności od częstotliwości aktualizacji)

## 9. Etapy wdrożenia

### 1. Stworzenie serwisu dla integracji Spotify

```typescript
// src/lib/services/spotify.service.ts
import { supabaseClient } from "../../db/supabase.client";
import type { SpotifyDataDTO, SpotifyDataDetails, SpotifySyncCommand } from "../../types";
import { z } from "zod";

// Schemat walidacji dla żądania synchronizacji
const spotifySyncSchema = z.object({
  user_id: z.number().positive()
});

// Schemat walidacji dla danych Spotify
const spotifyDataSchema = z.object({
  album_name: z.string().optional(),
  artist_name: z.string().optional(),
  genres: z.array(z.string()).optional(),
  popularity: z.number().min(0).max(100).optional(),
  release_date: z.string().optional(),
  tracks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      duration_ms: z.number().positive(),
      explicit: z.boolean(),
      preview_url: z.string().url().optional()
    })
  ).optional()
});

export class SpotifyService {
  /**
   * Inicjuje synchronizację danych z Spotify dla użytkownika.
   *
   * @param command - Komenda synchronizacji z Spotify
   * @returns Status synchronizacji
   * @throws Error w przypadku błędu bazy danych lub API Spotify
   */
  public static async syncSpotifyData(command: SpotifySyncCommand): Promise<{ message: string, status: 'success' | 'error' }> {
    // Walidacja danych wejściowych
    try {
      spotifySyncSchema.parse(command);
    } catch (error) {
      throw new Error(`Nieprawidłowe dane wejściowe: ${error.message}`);
    }

    try {
      // Pobieranie danych z Spotify API
      // W MVP możemy użyć symulowanych danych
      const spotifyData = await this.fetchSpotifyData(command.user_id.toString());
      
      // Walidacja pobranych danych
      const validatedData = spotifyDataSchema.parse(spotifyData);

      // Zapisanie danych w bazie
      const { error } = await supabaseClient
        .from("spotify_data")
        .insert({
          user_id: command.user_id.toString(),
          album_id: "sample_album_id", // W rzeczywistej implementacji z API Spotify
          artist_id: "sample_artist_id", // W rzeczywistej implementacji z API Spotify
          data: validatedData
        });

      if (error) {
        throw new Error(`Błąd podczas zapisywania danych Spotify: ${error.message}`);
      }

      return {
        message: "Synchronizacja z Spotify rozpoczęta",
        status: 'success'
      };
    } catch (error) {
      console.error(`Błąd podczas synchronizacji z Spotify: ${error.message}`);
      return {
        message: "Wystąpił błąd podczas synchronizacji z Spotify",
        status: 'error',
        details: error.message
      };
    }
  }
  
  /**
   * Pobiera dane Spotify dla użytkownika.
   *
   * @param userId - UUID użytkownika
   * @param limit - Limit wyników (domyślnie 10)
   * @param offset - Przesunięcie dla paginacji (domyślnie 0)
   * @returns Lista danych Spotify i metadane paginacji
   * @throws Error w przypadku błędu bazy danych
   */
  public static async getSpotifyData(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ data: SpotifyDataDTO[], count: number, limit: number, offset: number }> {
    // Pobranie liczby wszystkich rekordów
    const { count, error: countError } = await supabaseClient
      .from("spotify_data")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new Error(`Błąd podczas pobierania liczby rekordów: ${countError.message}`);
    }

    // Pobranie danych z paginacją
    const { data, error } = await supabaseClient
      .from("spotify_data")
      .select("*")
      .eq("user_id", userId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Błąd podczas pobierania danych Spotify: ${error.message}`);
    }

    // Mapowanie danych do DTO
    const mappedData = data.map(item => ({
      id: item.id,
      user_id: parseInt(item.user_id),
      album_id: item.album_id,
      artist_id: item.artist_id,
      data: item.data as SpotifyDataDetails,
      created_at: item.created_at
    }));

    return {
      data: mappedData,
      count: count || 0,
      limit,
      offset
    };
  }

  /**
   * Metoda pomocnicza do pobierania danych z Spotify API.
   * W MVP zwraca przykładowe dane, docelowo implementacja rzeczywistej integracji.
   *
   * @param userId - ID użytkownika
   * @returns Przykładowe dane z API Spotify
   */
  private static async fetchSpotifyData(userId: string): Promise<SpotifyDataDetails> {
    // Symulacja opóźnienia API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Przykładowe dane w formacie zwracanym przez API Spotify
    return {
      album_name: "Sample Album",
      artist_name: "Sample Artist",
      genres: ["Rock", "Alternative"],
      popularity: 85,
      release_date: "2023-04-15",
      tracks: [
        {
          id: "track_1",
          name: "Sample Track 1",
          duration_ms: 240000,
          explicit: false,
          preview_url: "https://spotify.com/preview/track_1"
        },
        {
          id: "track_2",
          name: "Sample Track 2",
          duration_ms: 180000,
          explicit: true,
          preview_url: "https://spotify.com/preview/track_2"
        }
      ]
    };
  }
}
```

### 2. Implementacja endpointu POST /spotify/sync

```typescript
// src/pages/api/spotify/sync.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { SpotifyService } from "../../../lib/services/spotify.service";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Weryfikacja autoryzacji
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Sprawdzenie zawartości żądania
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Wymagana zawartość typu application/json" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Parsowanie danych wejściowych
    const requestBody = await request.json();
    
    // Walidacja danych wejściowych używając Zod
    const schema = z.object({
      user_id: z.number().positive()
    });
    
    try {
      schema.parse(requestBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ 
          error: "Nieprawidłowe dane wejściowe", 
          details: validationError.errors 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Wywołanie serwisu Spotify
    const result = await SpotifyService.syncSpotifyData(requestBody);
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Błąd podczas przetwarzania żądania synchronizacji Spotify:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Wystąpił błąd podczas przetwarzania żądania", 
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
```

### 3. Implementacja endpointu GET /users/{id}/spotify

```typescript
// src/pages/api/users/[id]/spotify.ts
import type { APIRoute } from "astro";
import { SpotifyService } from "../../../../lib/services/spotify.service";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Weryfikacja autoryzacji
    const token = cookies.get("sb-token")?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Pobieranie ID użytkownika z parametrów URL
    const userId = params.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Wymagane ID użytkownika" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Pobieranie parametrów paginacji z query string
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Sprawdzanie poprawności parametrów paginacji
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: "Parametr 'limit' musi być liczbą między 1 a 100" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return new Response(
        JSON.stringify({ error: "Parametr 'offset' musi być liczbą nieujemną" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Pobieranie danych Spotify
    const spotifyData = await SpotifyService.getSpotifyData(userId, limit, offset);
    
    // Sprawdzanie czy istnieją dane
    if (spotifyData.data.length === 0 && offset === 0) {
      return new Response(
        JSON.stringify({ error: "Nie znaleziono danych Spotify dla podanego użytkownika" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify(spotifyData),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Błąd podczas pobierania danych Spotify:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Wystąpił błąd podczas przetwarzania żądania", 
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
```

### 4. Aktualizacja pliku src/types.ts

```typescript
// Zaktualizowane definicje typów dla integracji z Spotify
export interface SpotifyDataDetails {
  album_name?: string;
  artist_name?: string;
  genres?: string[];
  popularity?: number;
  release_date?: string;
  tracks?: SpotifyTrack[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
}

export interface SpotifySyncResponseDTO {
  message: string;
  status: 'success' | 'error';
  details?: string;
}

export interface SpotifyDataListResponseDTO {
  data: SpotifyDataDTO[];
  count: number;
  limit: number;
  offset: number;
}
```

### 5. Dokumentacja

1. Aktualizacja dokumentacji API z nowymi endpointami
2. Tworzenie przykładów wykorzystania API dla innych członków zespołu
3. Aktualizacja README projektu z informacją o nowych funkcjonalnościach 