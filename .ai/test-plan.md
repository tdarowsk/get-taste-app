# Plan Testów dla Projektu getTaste

## 1. Wprowadzenie

### Cel planu testów
Celem planu testów jest weryfikacja poprawności działania aplikacji getTaste, zapewnienie jakości funkcjonalności oraz identyfikacja i minimalizacja ryzyk związanych z wdrożeniem.

### Zakres testowania
- Interfejs użytkownika (rejestracja, logowanie, formularze preferencji, dashboard rekomendacji)
- API i logika biznesowa (analiza gustów, mechanizm rekomendacji)
- Integracje z zewnętrznymi usługami (Supabase, Openrouter.ai)
- Wydajność i bezpieczeństwo aplikacji

## 2. Strategia testowania

### Rodzaje testów do przeprowadzenia
- **Testy jednostkowe**: logika funkcji w `src/lib/services`, hooki React, walidacja formularzy.
- **Testy integracyjne**: komunikacja z Supabase, wywołania API, przepływy danych między komponentami React.
- **Testy end-to-end** (E2E): scenariusze rejestracji/logowania, konfiguracja konta, generowanie rekomendacji.
- **Testy wydajnościowe**: czasy odpowiedzi API, obciążenie generowania rekomendacji przy wielu preferencjach.
- **Testy bezpieczeństwa**: uwierzytelnianie, autoryzacja, ochrona przed wstrzyknięciami i atakami XSS.

### Priorytety testowania
1. Kluczowe ścieżki użytkownika (rejestracja, logowanie, generowanie rekomendacji).
2. Stabilność i poprawność modułu rekomendacji (usługi w `taste.service.ts`).
3. Integracje z Supabase i Openrouter.ai.
4. Wydajność i obsługa błędów.
5. Testy UI i dostępność.

## 3. Środowisko testowe

### Wymagania sprzętowe i programowe
- Node.js v18+, npm/yarn
- Przeglądarki: Chrome (najnowsza), Firefox, Safari
- Supabase CLI i instancja testowa PostgreSQL
- Dostęp do konta Openrouter.ai z testowym API keyiem

### Konfiguracja środowiska
1. Skonfigurować zmienne środowiskowe `.env.test` zgodnie z dokumentacją.
2. Uruchomić Supabase lokalnie: `supabase start | cat`.
3. Zainstalować zależności: `npm ci`.
4. Uruchomić aplikację w trybie testowym: `npm test`.
5. Skonfigurować CI/CD (GitHub Actions) do automatycznego uruchamiania testów.

## 4. Przypadki testowe

### A. Rejestracja i logowanie
- TC-01: Rejestracja nowego użytkownika (formularz, walidacja, redirect).
- TC-02: Rejestracja poprzez OAuth (Spotify, Google).
- TC-03: Logowanie poprawnymi danymi.
- TC-04: Obsługa błędnych danych uwierzytelniających.
- TC-05: Odzyskiwanie hasła i weryfikacja e-mail.

### B. Formularz preferencji
- TC-06: Wybór minimum jednego gatunku muzycznego/filmowego.
- TC-07: Walidacja pola reżysera (opcjonalne).
- TC-08: Zapis preferencji i komunikat sukcesu.
- TC-09: Obsługa błędu zapisu (toast, ponowienie).

### C. Generowanie rekomendacji
- TC-10: Wywołanie API rekomendacji przy poprawnych preferencjach.
- TC-11: Wyświetlenie rekomendacji na dashboardzie.
- TC-12: Obsługa braku preferencji (komunikat).
- TC-13: Obsługa błędów API (ponowienie, zachowanie starego widoku).

### D. Logika analizy gustu (`taste.service.ts`)
- TC-14: `determineMusicMood` – pokrycie mapowania gatunków do nastrojów.
- TC-15: `determineFilmStyle` – obsługa różnych kombinacji.
- TC-16: `calculateMusicIntensity/Variety` – wartości graniczne i domyślne.

### E. UI i dostępność
- TC-17: Walidacja dostępności komponentów (WCAG 2.1 AA).
- TC-18: Responsywność na urządzeniach mobilnych.
- TC-19: Obsługa klawiatury (nawigacja tabem, ESC dla modali).

### F. Wydajność i bezpieczeństwo
- TC-20: Pomiar czasu odpowiedzi API rekomendacji pod obciążeniem.
- TC-21: Testy penetrujące – SQL injection, XSS w formularzach.

## 5. Harmonogram i zasoby

| Etap                         | Czas trwania | Zasoby           |
|------------------------------|-------------:|------------------|
| Testy jednostkowe            |       2 tyg. | 2 QA             |
| Testy integracyjne           |       3 tyg. | 2 QA             |
| Testy E2E                     |       2 tyg. | 3 QA             |
| Testy wydajności i bezpieczeństwa | 1 tydz.  | 1 QA, DevOps     |

## 6. Kryteria akceptacji

1. Pokrycie testami jednostkowymi ≥ 90%.
2. Brak krytycznych błędów w testach E2E.
3. Wszystkie testy integracyjne zakończone sukcesem.
4. Wyniki testów wydajnościowych mieszczą się w SLA.

## 7. Raportowanie i śledzenie błędów

- Narzędzie: Jira (projekt GETTASTE)
- Szablon raportu błędu:
  - Opis kroku reprodukcji
  - Oczekiwane i rzeczywiste zachowanie
  - Zrzuty ekranu/logi
- Proces:
  1. Zgłoszenie błędu przez QA w Jira.
  2. Priorytetyzacja przez Product Ownera.
  3. Weryfikacja naprawy i zamknięcie zadania.