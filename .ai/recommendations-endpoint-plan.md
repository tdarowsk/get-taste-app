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
  - `RecommendationFeedback` - reprezentuje reakcję użytkownika na rekomendację; zawiera pola: `id`, `recommendation_id`, `user_id`, `feedback_type`, `created_at`.
- **Command Model:**
  - `CreateRecommendationsCommand` – reprezentuje payload otrzymywany w żądaniu, zawierający pola: `type` oraz `force_refresh`.
  - `SubmitRecommendationFeedbackCommand` - reprezentuje payload dla zgłaszania reakcji użytkownika, zawierający pole: `feedback_type`.
- **Enum:**
  - `RecommendationFeedbackType` - typ enum z wartościami: `LIKE`, `DISLIKE`.

## 4. Szczegóły odpowiedzi
- **Kod statusu:** 201 Created (w przypadku sukcesu)
- **Struktura odpowiedzi:** Obiekt typu `RecommendationDTO`, przykładowa struktura:
  ```typescript
  interface RecommendationDTO {
    id: number;
    user_id: number;
    type: "music" | "film";
    data: RecommendationDataDetails;
    created_at: string;
    feedback?: RecommendationFeedback;
  }

  interface RecommendationDataDetails {
    title?: string;
    description?: string;
    items?: RecommendationItem[];
    [key: string]: unknown;
  }

  interface RecommendationItem {
    id: string;
    name: string;
    type: string;
    details?: Record<string, unknown>;
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
   - W przypadku braku rekomendacji z API lub błędów, serwis może zwrócić predefiniowane dane mockowe dla zapewnienia ciągłości działania aplikacji.
5. Zapis wygenerowanej rekomendacji w tabeli `Recommendations` bazy danych, z zachowaniem polityk RLS.
6. Zwrot odpowiedzi – obiekt `RecommendationDTO` zawierający nowo wygenerowane rekomendacje.

## 6. Feedback na rekomendacje

### 6.1. Endpoint: POST /users/{id}/recommendations/{rec_id}/feedback
Dedykowany endpoint do przesyłania reakcji użytkownika na konkretną rekomendację.

- **Metoda HTTP:** POST
- **Struktura URL:** /users/{id}/recommendations/{rec_id}/feedback
- **Parametry:**
  - **Wymagane:**
    - URL Parameters: 
      - `id` (liczba całkowita) – identyfikator użytkownika
      - `rec_id` (liczba całkowita) – identyfikator rekomendacji
    - Request Body:
      - `feedback_type` (string): wartość "like" lub "dislike"
  - **Request Body Example:**
    ```json
    {
      "feedback_type": "like"  // lub "dislike"
    }
    ```

### 6.2. Przepływ danych dla feedbacku
1. Endpoint odbiera żądanie z URL Parameters oraz payloadem `SubmitRecommendationFeedbackCommand`.
2. Middleware uwierzytelniający weryfikuje token JWT i uprawnienia użytkownika.
3. Walidacja danych wejściowych, sprawdzenie czy `feedback_type` przyjmuje wartość "like" lub "dislike".
4. Zapisanie feedbacku w tabeli `recommendations_feedback` z zachowaniem polityk RLS.
5. Zwrot odpowiedzi z kodem 201 Created oraz danymi zapisanego feedbacku.

### 6.3. Endpoint: GET /users/{id}/recommendation-history
Endpoint umożliwiający pobieranie historii rekomendacji użytkownika wraz z udzielonymi feedbackami.

- **Metoda HTTP:** GET
- **Struktura URL:** /users/{id}/recommendation-history
- **Parametry Query:**
  - **Opcjonalne:**
    - `type`: filtrowanie po typie rekomendacji ("music" lub "film")
    - `feedback_type`: filtrowanie po typie feedbacku ("like" lub "dislike")
    - `limit`: limit wyników (domyślnie 10)
    - `offset`: przesunięcie dla paginacji (domyślnie 0)

## 7. Względy bezpieczeństwa
- Uwierzytelnienie za pomocą JWT; wykorzystanie RLS, aby użytkownik mógł operować tylko na swoich danych.
- Walidacja wejścia (np. Zod) w celu zapobiegania wstrzyknięciom oraz nieprawidłowym danym.
- Bezpieczna komunikacja z usługą Openrouter.ai oraz obsługa błędów komunikacyjnych.
- Ograniczenie dostępu do endpointu tylko dla autoryzowanych użytkowników.
- Stosowanie unikalnych ograniczeń w bazie danych, aby zapobiec duplikatom feedbacku od tego samego użytkownika dla tej samej rekomendacji.

## 8. Obsługa błędów
- **400 Bad Request:** Nieprawidłowy format danych wejściowych lub brak wymaganych pól.
- **401 Unauthorized:** Brak lub nieprawidłowy token JWT.
- **404 Not Found:** Użytkownik o podanym `id` lub rekomendacja o podanym `rec_id` nie istnieje.
- **500 Internal Server Error:** Błąd podczas generowania rekomendacji, problem z usługą Openrouter.ai lub błąd przy zapisie do bazy.
- Logowanie błędów (opcjonalnie zapis do dedykowanej tabeli błędów) oraz wysyłanie odpowiednich komunikatów do klienta.
- Implementacja mechanizmu fallback do danych mockowych w przypadku błędów API.

## 9. Rozważania dotyczące wydajności
- Asynchroniczne wywołania do Openrouter.ai, aby nie blokować głównego wątku przetwarzania.
- Możliwość buforowania wyników rekomendacji, gdy `force_refresh` jest ustawione na false, dla zmniejszenia obciążenia usługi.
- Optymalizacja zapytań do bazy danych przy użyciu indeksów na polach `user_id` i `type`.
- Wykorzystanie widoku `recommendation_history` dla szybkiego dostępu do historii rekomendacji z feedbackiem.
- Unikalne indeksy na tabeli `recommendations_feedback` dla pary (`recommendation_id`, `user_id`) w celu uniknięcia duplikatów.

## 10. Etapy wdrożenia
1. **Przygotowanie środowiska:**
   - Konfiguracja projektu (Next.js, Supabase, integracja z Openrouter.ai).
   - Dodanie niezbędnych zależności (np. Zod, narzędzia logowania błędów).
2. **Implementacja endpointu:**
   - Utworzenie route handler dla POST /users/{id}/recommendations.
   - Utworzenie route handler dla POST /users/{id}/recommendations/{rec_id}/feedback.
   - Utworzenie route handler dla GET /users/{id}/recommendation-history.
   - Implementacja middleware do uwierzytelnienia i walidacji żądania.
3. **Integracja z RecommendationService:**
   - Implementacja wywołania usługi Openrouter.ai oraz logiki buforowania wyników.
   - Przygotowanie danych mockowych jako mechanizmu fallback.
4. **Interakcja z bazą danych:**
   - Zapis nowo wygenerowanej rekomendacji w tabeli `Recommendations`.
   - Zapis feedbacku w tabeli `recommendations_feedback`.
   - Implementacja zapytań do widoku `recommendation_history`.
5. **Obsługa błędów i logowanie:**
   - Implementacja globalnego mechanizmu obsługi błędów i logowania krytycznych błędów.
   - Testowanie różnych scenariuszy błędów i mechanizmów fallback.

## 11. Implementacyjne podejście do danych testowych
W ramach wdrożenia przygotowano kompleksowe dane testowe obejmujące:
- Przykładowe dane użytkowników
- Zróżnicowane preferencje muzyczne i filmowe
- Przykładowe rekomendacje różnych typów
- Przykładowe reakcje użytkowników (like/dislike)

Dane testowe są dostępne w postaci plików migracji SQL, co pozwala na szybkie przywrócenie bazy danych do znanego stanu podczas rozwoju i testowania.
