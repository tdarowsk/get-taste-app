```
# Plan Testów dla Projektu getTaste

## 1. Wprowadzenie

### 1.1. Cel planu testów

Celem niniejszego planu testów jest zapewnienie kompleksowego podejścia do weryfikacji jakości aplikacji "getTaste". Plan obejmuje strategię testowania, zasoby, harmonogram oraz kryteria akceptacji, mające na celu identyfikację i eliminację błędów przed wdrożeniem aplikacji, zapewniając jej stabilność, funkcjonalność, wydajność i bezpieczeństwo zgodnie z wymaganiami.

### 1.2. Zakres testowania

Testowanie obejmie następujące kluczowe obszary funkcjonalne i niefunkcjonalne aplikacji getTaste:

*   **Moduł Uwierzytelniania:** Rejestracja, logowanie, wylogowanie, resetowanie hasła, zarządzanie sesją, ochrona ścieżek.
*   **Panel Główny (Dashboard):** Wyświetlanie interfejsu użytkownika, nawigacja, ładowanie danych użytkownika.
*   **Rekomendacje:** Generowanie (wymuszone i automatyczne), pobieranie, wyświetlanie (muzyka, film), mechanizm feedbacku (polubienie/nie lubienie), historia rekomendacji i ocen.
*   **Preferencje Użytkownika:** Pobieranie, aktualizacja i wpływ preferencji (muzycznych, filmowych) na rekomendacje.
*   **Profil Użytkownika:** Wyświetlanie danych, potencjalna aktualizacja (np. nick).
*   **Integracje Zewnętrzne:**
    *   Spotify (synchronizacja danych, potencjalne wykorzystanie w rekomendacjach).
    *   OpenRouter (generowanie rekomendacji AI).
    *   TMDB (pobieranie danych filmowych - implikowane).
*   **Komponenty UI:** Testowanie komponentów z systemu projektowego (`airbnb-design-system`, `ui`) pod kątem funkcjonalności i wyglądu.
*   **API Endpoints:** Testowanie wszystkich punktów końcowych API (`pages/api/`) pod kątem logiki biznesowej, walidacji, obsługi błędów i bezpieczeństwa.
*   **Aspekty Niefunkcjonalne:** Wydajność, bezpieczeństwo, użyteczność, dostępność (WCAG), kompatybilność międzyprzeglądarkowa i responsywność.

**Poza zakresem:**

*   Testowanie infrastruktury Supabase/OpenRouter/Spotify/TMDB (skupienie na integracji).
*   Testowanie kodu zewnętrznych bibliotek (zakładając, że są stabilne).

## 2. Strategia testowania

Strategia opiera się na wielopoziomowym podejściu, łączącym różne typy testów w celu zapewnienia maksymalnego pokrycia i wczesnego wykrywania błędów.

### 2.1. Rodzaje testów do przeprowadzenia

*   **Testy jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania izolowanych fragmentów kodu (funkcje, komponenty React, hooki, usługi).
    *   **Technologie:** Vitest.
    *   **Zakres:** Komponenty UI (`.tsx`), hooki (`hooks/`, `lib/hooks/`), funkcje pomocnicze (`lib/utils/`, `lib/validation.ts`), logika serwisów (`lib/services/` z mockowaniem zależności), logika transformacji danych (`lib/utils/transformers.ts`).
*   **Testy integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja współpracy między różnymi modułami i komponentami systemu.
    *   **Technologie:** Vitest, RTL, Supertest (dla API), ew. MSW (Mock Service Worker).
    *   **Zakres:** Interakcje komponentów React (np. formularz -> hook -> API), integracja hooków (`useDashboard`), działanie middleware (`middleware/index.ts`), punkty końcowe API (interakcja z serwisami i mockowaną bazą danych/zewnętrznymi API).
*   **Testy End-to-End (E2E):**
    *   **Cel:** Symulacja rzeczywistych przepływów użytkownika w aplikacji działającej w środowisku zbliżonym do produkcyjnego.
    *   **Technologie:** Playwright.
    *   **Zakres:** Kluczowe scenariusze użytkownika (rejestracja, logowanie, przeglądanie dashboardu, generowanie/ocenianie rekomendacji, aktualizacja preferencji, wylogowanie, reset hasła). Testowanie responsywności i kompatybilności międzyprzeglądarkowej.
*   **Testy API:**
    *   **Cel:** Bezpośrednia weryfikacja kontraktów, funkcjonalności, bezpieczeństwa i wydajności punktów końcowych API.
    *   **Technologie:** Postman/Insomnia lub biblioteki jak Supertest/Axios w kodzie.
    *   **Zakres:** Wszystkie endpointy w `pages/api/`, weryfikacja metod HTTP, walidacji danych wejściowych/wyjściowych, kodów odpowiedzi, obsługi błędów, autoryzacji.
*   **Testy wizualnej regresji (Visual Regression Tests):**
    *   **Cel:** Wykrywanie niezamierzonych zmian wizualnych w komponentach UI.
    *   **Technologie:** Chromatic (integracja ze Storybook) lub Percy.
    *   **Zakres:** Komponenty UI z `components/airbnb-design-system` i `components/ui`. Wymaga implementacji Storybook.
*   **Testy bezpieczeństwa (Security Testing):**
    *   **Cel:** Identyfikacja potencjalnych luk bezpieczeństwa.
    *   **Technologie:** Ręczna weryfikacja, narzędzia do skanowania (np. OWASP ZAP, Snyk).
    *   **Zakres:** Procesy uwierzytelniania i autoryzacji, walidacja danych wejściowych (zapobieganie XSS, SQL Injection - chociaż Supabase pomaga), zarządzanie sesją, konfiguracja CORS, bezpieczeństwo zależności.
*   **Testy wydajności (Performance Testing):**
    *   **Cel:** Ocena szybkości ładowania stron i odpowiedzi API pod obciążeniem.
    *   **Technologie:** Lighthouse, k6, narzędzia deweloperskie przeglądarki.
    *   **Zakres:** Czas ładowania kluczowych stron (Login, Register, Dashboard), czas odpowiedzi API (zwłaszcza generowanie rekomendacji), optymalizacja zapytań do bazy danych.
*   **Testy dostępności (Accessibility Testing):**
    *   **Cel:** Zapewnienie zgodności ze standardami dostępności (np. WCAG).
    *   **Technologie:** Axe DevTools, Lighthouse, czytniki ekranu.
    *   **Zakres:** Struktura semantyczna HTML, kontrast kolorów, nawigacja klawiaturą, atrybuty ARIA, opisy alternatywne obrazów.

### 2.2. Priorytety testowania

Testy będą priorytetyzowane na podstawie ryzyka i krytyczności funkcjonalności:

1.  **Krytyczne (Must Test):**
    *   Funkcjonalności związane z uwierzytelnianiem i autoryzacją (logowanie, rejestracja, ochrona dostępu).
    *   Generowanie i podstawowe wyświetlanie rekomendacji.
    *   Kluczowe endpointy API (auth, recommendations, preferences).
    *   Integralność podstawowych danych użytkownika.
2.  **Wysokie (Should Test):**
    *   Mechanizm feedbacku dla rekomendacji i jego wpływ na przyszłe sugestie.
    *   Zarządzanie preferencjami użytkownika.
    *   Resetowanie hasła.
    *   Integracja ze Spotify (jeśli krytyczna dla rekomendacji).
    *   Podstawowa responsywność i działanie na głównych przeglądarkach.
3.  **Średnie (Could Test):**
    *   Zaawansowane filtrowanie/sortowanie rekomendacji/historii.
    *   Integracja z OpenRouter (testowanie różnych modeli, obsługi błędów).
    *   Pełne testy wizualnej regresji dla wszystkich komponentów.
    *   Testy wydajności pod dużym obciążeniem.
    *   Pełne testy dostępności.
4.  **Niskie (Won't Test initially / Optional):**
    *   Strony statyczne (np. strona powitalna, o ile nie zawiera dynamicznych elementów).
    *   Mniej krytyczne komponenty UI.

### 2.3. Podejście do danych testowych

*   Wykorzystanie danych mockowych (`mockData.ts`) do testów jednostkowych i integracyjnych.
*   Generowanie danych testowych w środowisku Staging (np. dedykowani użytkownicy testowi z różnymi preferencjami).
*   Mockowanie odpowiedzi z zewnętrznych API (Spotify, OpenRouter, TMDB) za pomocą narzędzi takich jak MSW lub dedykowanych mocków w testach.

## 3. Środowisko testowe

### 3.1. Wymagania sprzętowe i programowe

*   **Sprzęt:** Standardowe stacje robocze dla inżynierów QA, dostęp do różnych urządzeń (desktop, tablet, mobile) lub emulatorów/symulatorów.
*   **Oprogramowanie:**
    *   Przeglądarki: Chrome, Firefox, Safari, Edge (najnowsze wersje).
    *   Systemy operacyjne: Windows, macOS, Linux (dla QA), iOS, Android (dla testów mobilnych).
    *   Narzędzia: Node.js, npm/yarn, Git, Docker (opcjonalnie, do konteneryzacji środowiska), wybrane narzędzia do automatyzacji (Playwright, Vitest), Postman/Insomnia.
    *   Dostęp do systemu śledzenia błędów (np. Jira).

### 3.2. Konfiguracja środowiska

*   **Development:** Środowisko lokalne deweloperów, wykorzystywane głównie do testów jednostkowych i integracyjnych. Wymaga lokalnych kluczy Supabase (anon) i potencjalnie mocków dla innych usług.
*   **Staging/Test:** Środowisko odzwierciedlające produkcję, hostowane na dedykowanej infrastrukturze. Połączone z dedykowaną instancją Supabase (Staging), OpenRouter (z kluczem testowym), Spotify (z kontem testowym), TMDB. Wykorzystywane do testów E2E, API, UAT, wydajnościowych i bezpieczeństwa.
*   **Production:** Środowisko produkcyjne, dostępne dla użytkowników końcowych. Testy ograniczone do smoke testów po wdrożeniu.

## 4. Przypadki testowe

Poniżej znajduje się lista wysokopoziomowych przypadków testowych. Szczegółowe przypadki testowe zostaną opracowane i udokumentowane w dedykowanym narzędziu (np. TestRail, Xray for Jira).

### 4.1. Uwierzytelnianie

*   TC-AUTH-001: Weryfikacja pomyślnej rejestracji nowego użytkownika z poprawnymi danymi.
*   TC-AUTH-002: Weryfikacja nieudanej rejestracji z niepoprawnymi danymi (np. zły email, słabe hasło, zajęty email).
*   TC-AUTH-003: Weryfikacja pomyślnego logowania z poprawnymi danymi uwierzytelniającymi.
*   TC-AUTH-004: Weryfikacja nieudanego logowania z niepoprawnymi danymi uwierzytelniającymi.
*   TC-AUTH-005: Weryfikacja procesu resetowania hasła (żądanie linku, ustawienie nowego hasła).
*   TC-AUTH-006: Weryfikacja pomyślnego wylogowania użytkownika.
*   TC-AUTH-007: Weryfikacja ochrony dostępu do stron chronionych (np. /dashboard) dla niezalogowanego użytkownika (przekierowanie do logowania).
*   TC-AUTH-008: Weryfikacja zarządzania sesją (np. ważność sesji, odświeżanie tokenów - jeśli dotyczy).

### 4.2. Dashboard i Rekomendacje

*   TC-DASH-001: Weryfikacja poprawnego wyświetlania dashboardu po zalogowaniu (nagłówek, panel rekomendacji, panel preferencji/historii).
*   TC-DASH-002: Weryfikacja poprawnego ładowania i wyświetlania rekomendacji muzycznych.
*   TC-DASH-003: Weryfikacja poprawnego ładowania i wyświetlania rekomendacji filmowych.
*   TC-DASH-004: Weryfikacja przełączania między typami rekomendacji (Muzyka/Film).
*   TC-DASH-005: Weryfikacja działania przycisku odświeżania rekomendacji.
*   TC-DASH-006: Weryfikacja mechanizmu feedbacku (Like/Dislike) w panelu bocznym (`RecommendationSidebar`).
*   TC-DASH-007: Weryfikacja wyświetlania historii ocenionych rekomendacji (`RecommendationHistory`).
*   TC-DASH-008: Weryfikacja poprawnego wyświetlania szczegółów rekomendacji (`RecommendationDetail`).
*   TC-DASH-009: Weryfikacja obsługi stanu ładowania podczas pobierania/generowania rekomendacji.
*   TC-DASH-010: Weryfikacja obsługi pustego stanu (brak rekomendacji, brak historii).
*   TC-DASH-011: Weryfikacja działania rekomendacji dla nowego użytkownika (bez preferencji).

### 4.3. Preferencje Użytkownika

*   TC-PREF-001: Weryfikacja pobierania i wyświetlania obecnych preferencji użytkownika (jeśli istnieje UI).
*   TC-PREF-002: Weryfikacja możliwości aktualizacji preferencji muzycznych.
*   TC-PREF-003: Weryfikacja możliwości aktualizacji preferencji filmowych.
*   TC-PREF-004: Weryfikacja wpływu zaktualizowanych preferencji na generowane rekomendacje (po odświeżeniu).

### 4.4. Integracje Zewnętrzne

*   TC-INT-001: Weryfikacja (mockowanej) synchronizacji danych Spotify.
*   TC-INT-002: Weryfikacja (mockowanego) generowania rekomendacji przez OpenRouter.
*   TC-INT-003: Weryfikacja (mockowanego) pobierania danych filmowych (np. TMDB).
*   TC-INT-004: Weryfikacja obsługi błędów podczas komunikacji z zewnętrznymi API.

### 4.5. API

*   TC-API-001: Weryfikacja poprawności działania endpointu POST /api/auth/register.
*   TC-API-002: Weryfikacja poprawności działania endpointu POST /api/auth/login.
*   TC-API-003: Weryfikacja poprawności działania endpointu POST /api/auth/logout.
*   TC-API-004: Weryfikacja poprawności działania endpointów resetowania hasła.
*   TC-API-005: Weryfikacja poprawności działania endpointu GET /api/auth/status.
*   TC-API-006: Weryfikacja poprawności działania endpointu POST /api/users/{id}/recommendations.
*   TC-API-007: Weryfikacja poprawności działania endpointów GET/PATCH /api/users/{id}/preferences/*.
*   TC-API-008: Weryfikacja poprawności działania endpointu GET /api/users/{id}/recommendation-history.
*   TC-API-009: Weryfikacja poprawności działania endpointu POST /api/users/{id}/recommendations/{rec_id}/feedback.
*   TC-API-010: Weryfikacja poprawności działania endpointów AI (/api/ai/*).
*   TC-API-011: Weryfikacja poprawności działania endpointów Spotify (/api/spotify/*, /api/users/{id}/spotify).
*   TC-API-012: Weryfikacja walidacji danych wejściowych dla wszystkich endpointów.
*   TC-API-013: Weryfikacja autoryzacji i obsługi błędów dla wszystkich endpointów.

### 4.6. Niefunkcjonalne

*   TC-NF-001: Weryfikacja responsywności UI na różnych rozmiarach ekranu (mobile, tablet, desktop).
*   TC-NF-002: Weryfikacja kompatybilności z głównymi przeglądarkami (Chrome, Firefox, Safari, Edge).
*   TC-NF-003: Podstawowe testy wydajności kluczowych stron (czas ładowania).
*   TC-NF-004: Podstawowe testy bezpieczeństwa (np. próba dostępu do chronionych zasobów bez logowania).
*   TC-NF-005: Podstawowe testy dostępności (np. nawigacja klawiaturą, kontrast).

## 5. Harmonogram i zasoby

### 5.1. Szacunkowy czas trwania testów

*   **Planowanie i przygotowanie testów:** 3-5 dni roboczych.
*   **Wykonanie testów jednostkowych i integracyjnych:** Ciągłe, w ramach procesu deweloperskiego.
*   **Wykonanie testów API:** 3-5 dni roboczych (na cykl regresji).
*   **Wykonanie testów E2E:** 5-7 dni roboczych (na cykl regresji).
*   **Wykonanie testów wizualnej regresji:** 1-2 dni roboczych (na cykl regresji, wymaga konfiguracji).
*   **Wykonanie testów bezpieczeństwa, wydajności, dostępności:** 2-4 dni roboczych (na cykl).
*   **Testy regresji:** 3-5 dni roboczych (przed każdym wydaniem).
*   **Testy UAT (User Acceptance Testing):** Zależne od dostępności interesariuszy (np. 2-3 dni).

*Uwaga: Powyższe szacunki są orientacyjne i mogą ulec zmianie w zależności od złożoności nowych funkcji i liczby znalezionych błędów.*

### 5.2. Wymagane zasoby

*   **Ludzkie:**
    *   1-2 Inżynierów QA (odpowiedzialni za planowanie, projektowanie, wykonanie testów manualnych i automatycznych E2E/API, raportowanie).
    *   Deweloperzy (odpowiedzialni za pisanie i utrzymanie testów jednostkowych i integracyjnych, wsparcie w debugowaniu).
    *   Product Owner/Manager (do UAT, definiowania priorytetów).
*   **Techniczne:**
    *   Dostęp do środowisk testowych (Staging).
    *   Licencje na narzędzia (jeśli wymagane, np. Chromatic, TestRail).
    *   Dostęp do narzędzi do automatyzacji i śledzenia błędów.
    *   Konta testowe dla usług zewnętrznych (Spotify, OpenRouter).

## 6. Kryteria akceptacji

Aplikacja zostanie uznana za gotową do wydania, jeśli spełnione zostaną następujące kryteria:

*   **Kryteria wejścia (rozpoczęcia testów):**
    *   Kod źródłowy został wdrożony na środowisku testowym (Staging).
    *   Podstawowe testy jednostkowe i integracyjne przechodzą pomyślnie (np. >95%).
    *   Dokumentacja (jeśli istnieje) jest dostępna.
*   **Kryteria wyjścia (zakończenia testów / gotowości do wydania):**
    *   Wszystkie zaplanowane przypadki testowe dla krytycznych i wysokich priorytetów zostały wykonane.
    *   100% przypadków testowych o priorytecie krytycznym zakończyło się sukcesem.
    *   Minimum 95% przypadków testowych o priorytecie wysokim zakończyło się sukcesem.
    *   Minimum 85% przypadków testowych o priorytecie średnim zakończyło się sukcesem.
    *   Brak otwartych błędów o statusie Krytyczny (Blocker) lub Wysoki (Critical/Major).
    *   Wszystkie znane błędy o niższym priorytecie zostały udokumentowane i zaakceptowane przez Product Ownera do potencjalnej naprawy w przyszłych iteracjach.
    *   Przeprowadzono pomyślnie testy regresji.
    *   Przeprowadzono i zaakceptowano testy UAT (jeśli dotyczy).
    *   Raport końcowy z testów został przygotowany i zaakceptowany.

## 7. Raportowanie i śledzenie błędów

*   **Narzędzie:** Jira (lub inne wybrane narzędzie do zarządzania projektami i błędami).
*   **Proces raportowania:**
    *   Każdy znaleziony błąd zostanie zgłoszony jako osobny ticket w systemie Jira.
    *   Ticket powinien zawierać: tytuł, opis (kroki do reprodukcji, wynik oczekiwany, wynik aktualny), środowisko, priorytet/ciężkość, załączniki (screenshoty, logi).
*   **Priorytety/Ciężkość błędów:**
    *   **Krytyczny (Blocker):** Blokuje kluczowe funkcjonalności, brak obejścia.
    *   **Wysoki (Critical/Major):** Poważny błąd w kluczowej funkcjonalności, trudne obejście lub znaczący wpływ na użytkownika.
    *   **Średni (Minor):** Błąd w mniej istotnej funkcjonalności lub błąd w kluczowej funkcjonalności z łatwym obejściem.
    *   **Niski (Trivial):** Drobny błąd kosmetyczny lub literówka, nie wpływa na funkcjonalność.
*   **Zarządzanie błędami:**
    *   Regularne spotkania (np. Bug Triage) w celu przeglądu, priorytetyzacji i przypisania zgłoszonych błędów.
    *   Śledzenie statusu błędów (Nowy, W analizie, Do naprawy, W trakcie naprawy, Do testowania, Zamknięty, Odrzucony).
    *   Retestowanie naprawionych błędów przez zespół QA.
*   **Raportowanie statusu:** Regularne raporty o postępie testów, liczbie wykonanych/pozostałych przypadków, liczbie znalezionych/naprawionych błędów, ogólnym stanie jakości.
```