# API Endpoint Implementation Plan: POST /users/{id}/recommendations

## 1. Przegląd punktu końcowego
Endpoint POST /users/{id}/recommendations odpowiada za generowanie nowych rekomendacji (muzycznych lub filmowych) na podstawie bieżących preferencji użytkownika. Integruje się z usługą Openrouter.ai, która po stronie AI generuje rekomendacje. Wygenerowane dane są zapisywane w tabeli `Recommendations` w bazie danych i zwracane w odpowiedzi jako obiekt JSON.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /users/{id}/recommendations
- **Parametry:**
  - **Wymagane:**
    - URL Parameter: `id` (liczba całkowita) – identyfikator użytkownika
    - Request Body:
      - `type` (string): wartość \"music\" lub \"film\"
      - `force_refresh` (boolean): flaga wymuszająca odświeżenie rekomendacji
  - **Opcjonalne:** brak
- **Request Body Example:**
  ```json
  {
    "type": "music",  // lub "film"
    "force_refresh": true
  }
  ```
- **Uwierzytelnienie:** JWT token, weryfikowany przez middleware oraz zabezpieczony politykami RLS w Supabase.

## 3. Wykorzystywane typy
- **DTO:**
  - `RecommendationDTO` – reprezentuje dane rekomendacji; zawiera pola: `id`, `user_id`, `type`, `data`, `created_at`.
- **Command Model:**
  - `CreateRecommendationsCommand` – reprezentuje payload otrzymywany w żądaniu, zawierający pola: `type` oraz `force_refresh`.

## 4. Szczegóły odpowiedzi
- **Kod statusu:** 201 Created (w przypadku sukcesu)
- **Struktura odpowiedzi:** Obiekt typu `RecommendationDTO`, przykładowa struktura:
  ```typescript
  interface RecommendationDTO {
    id: number;
    user_id: number;
    type: "music" | "film";
    data: any;
    created_at: string;
  }
  ```
- **Kody błędów:**
  - 400 Bad Request – błędne dane wejściowe
  - 401 Unauthorized – brak lub nieprawidłowy token autoryzacyjny
  - 404 Not Found – użytkownik o podanym `id` nie istnieje
  - 500 Internal Server Error – błąd serwera lub problem z usługą Openrouter.ai

## 5. Przepływ danych
1. Endpoint odbiera żądanie z URL Parameter `id` oraz payloadem `CreateRecommendationsCommand`.
2. Middleware uwierzytelniający weryfikuje token JWT i potwierdza uprawnienia użytkownika (RLS w Supabase).
3. Walidacja danych wejściowych, np. za pomocą Zod – sprawdzenie, czy `type` przyjmuje wartość \"music\" lub \"film\", a `force_refresh` jest boolean.
4. Wywołanie serwisu rekomendacji (np. `RecommendationService`):
   - Jeśli `force_refresh` jest ustawione lub brak aktualnych rekomendacji, następuje wywołanie usługi Openrouter.ai w celu generowania nowych rekomendacji.
   - W przeciwnym razie, może nastąpić zwrócenie danych z cache.
5. Zapis wygenerowanej rekomendacji w tabeli `Recommendations` bazy danych, z zachowaniem polityk RLS.
6. Zwrot odpowiedzi – obiekt `RecommendationDTO` zawierający nowo wygenerowane rekomendacje.

## 6. Względy bezpieczeństwa
- Uwierzytelnienie za pomocą JWT; wykorzystanie RLS, aby użytkownik mógł operować tylko na swoich danych.
- Walidacja wejścia (np. Zod) w celu zapobiegania wstrzyknięciom oraz nieprawidłowym danym.
- Bezpieczna komunikacja z usługą Openrouter.ai oraz obsługa błędów komunikacyjnych.
- Ograniczenie dostępu do endpointu tylko dla autoryzowanych użytkowników.

## 7. Obsługa błędów
- **400 Bad Request:** Nieprawidłowy format danych wejściowych lub brak wymaganych pól.
- **401 Unauthorized:** Brak lub nieprawidłowy token JWT.
- **404 Not Found:** Użytkownik o podanym `id` nie istnieje.
- **500 Internal Server Error:** Błąd podczas generowania rekomendacji, problem z usługą Openrouter.ai lub błąd przy zapisie do bazy.
- Logowanie błędów (opcjonalnie zapis do dedykowanej tabeli błędów) oraz wysyłanie odpowiednich komunikatów do klienta.

## 8. Rozważania dotyczące wydajności
- Asynchroniczne wywołania do Openrouter.ai, aby nie blokować głównego wątku przetwarzania.
- Możliwość buforowania wyników rekomendacji, gdy `force_refresh` jest ustawione na false, dla zmniejszenia obciążenia usługi.
- Optymalizacja zapytań do bazy danych przy użyciu indeksów na polach `user_id` i `type`.

## 9. Etapy wdrożenia
1. **Przygotowanie środowiska:**
   - Konfiguracja projektu (Astro, Supabase, integracja z Openrouter.ai).
   - Dodanie niezbędnych zależności (np. Zod, narzędzia logowania błędów).
2. **Implementacja endpointu:**
   - Utworzenie route handler dla POST /users/{id}/recommendations.
   - Implementacja middleware do uwierzytelnienia i walidacji żądania.
3. **Integracja z RecommendationService:**
   - Wyodrębnienie logiki generowania rekomendacji do dedykowanego serwisu.
   - Implementacja wywołania usługi Openrouter.ai oraz logiki buforowania wyników.
4. **Interakcja z bazą danych:**
   - Zapis nowo wygenerowanej rekomendacji w tabeli `Recommendations` przy użyciu Supabase z uwzględnieniem RLS.
5. **Obsługa błędów i logowanie:**
   - Implementacja globalnego mechanizmu obsługi błędów i logowania krytycznych błędów.
