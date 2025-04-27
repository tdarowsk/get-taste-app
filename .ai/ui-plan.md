# Architektura UI dla getTaste

## 1. Przegląd struktury UI

Interfejs użytkownika dla getTaste dzieli się na kluczowe widoki, umożliwiające efektywną interakcję użytkownika z systemem. System wspiera proces rejestracji i logowania (w tym integrację z OAuth), automatyczne przejście do widoku wyboru nicku, ustawienia konta (z podziałem na dane logowania, konfigurację 2FA oraz personalizację, w tym synchronizację Spotify) oraz dashboard prezentujący rekomendacje. Aplikacja korzysta z React Query do zarządzania stanem i cache'owania danych, wykorzystuje podejście mobile first, a interfejs jest projektowany z myślą o dostępności (WCAG) i bezpieczeństwie (mechanizmy 2FA, OAuth).

## 2. Lista widoków

1. **Ekran Rejestracji/Logowania**
   - **Ścieżka widoku:** /auth
   - **Główny cel:** Umożliwienie użytkownikowi rejestracji lub logowania, z obsługą OAuth oraz tradycyjnych metod.
   - **Kluczowe informacje:** Formularze do wprowadzania danych, integracja OAuth, komunikaty bezpieczeństwa.
   - **Kluczowe komponenty:** Formularze, przyciski, integracja z zewnętrznymi usługami OAuth.
   - **UX, dostępność i bezpieczeństwo:** Mobile first, prosty i intuicyjny interfejs, pełna obsługa nawigacji klawiaturowej, zgodność z WCAG.

2. **Widok Wyboru Nicku**
   - **Ścieżka widoku:** /auth/nick
   - **Główny cel:** Uzupełnienie profilu użytkownika poprzez wybór nicku po rejestracji przez OAuth.
   - **Kluczowe informacje:** Pole input na nick, walidacja danych.
   - **Kluczowe komponenty:** Input na nick, tooltip wyświetlający informacje o wymaganiach walidacyjnych (domyślnie widoczny) oraz komunikat o błędzie pod inputem w przypadku nieprawidłowego nicku.
   - **UX, dostępność i bezpieczeństwo:** Automatyczne przejście z OAuth do tego widoku, walidacja inline, wsparcie dla użytkowników korzystających z urządzeń dotykowych i klawiaturowych.

3. **Ekran Ustawień Konta**
   - **Ścieżka widoku:** /account/settings
   - **Główny cel:** Zarządzanie danymi logowania, konfiguracją 2FA, personalizacją interfejsu oraz synchronizacją Spotify.
   - **Kluczowe informacje:** Dane konta (email, hasło), opcje 2FA, ustawienia personalizacji (np. tryb ciemny/jasny), konfiguracja synchronizacji Spotify (częstotliwość, status operacji, czas ostatniej synchronizacji).
   - **Kluczowe komponenty:** Formularze, inputy, przełączniki, spinner wyświetlany podczas operacji asynchronicznych.
   - **UX, dostępność i bezpieczeństwo:** Podział widoku na sekcje, pełna obsługa klawiatury, zgodność z WCAG, mechanizmy uwierzytelniania (2FA, OAuth).

4. **Dashboard i Widok Rekomendacji**
   - **Ścieżka widoku:** /dashboard
   - **Główny cel:** Prezentacja rekomendacji filmowych i muzycznych oraz ogólny przegląd aktywności użytkownika.
   - **Kluczowe informacje:** Lista rekomendacji wyświetlana dynamicznie, side panel prezentujący rekomendacje na desktopie.
   - **Kluczowe komponenty:** Karty rekomendacji, listy, przyciski akcji, mechanizmy aktualizacji typu toast message dla komunikatów.
   - **UX, dostępność i bezpieczeństwo:** Intuicyjny układ, responsywność (mobile i desktop), dynamiczne aktualizacje z użyciem React Query, zgodność z zasadami dostępności.

5. **Dodatkowe Widoki (opcjonalnie)**
   - **Widok Profilu Użytkownika:** Prezentacja szczegółowych informacji o użytkowniku i historii rekomendacji.
   - **Widok Szczegółów Synchronizacji Spotify:** Możliwość przeglądania szczegółowych danych dotyczących synchronizacji, dostępny w ramach ustawień konta.

## 3. Mapa podróży użytkownika

1. **Rejestracja/Logowanie:**
   - Użytkownik rozpoczyna interakcję na ekranie logowania/rejestracji, wybierając metodę logowania (OAuth lub tradycyjny formularz).

2. **Proces OAuth i Wybór Nicku:**
   - Po rejestracji przez OAuth następuje automatyczne przekierowanie do widoku wyboru nicku. Użytkownik uzupełnia swój nick, korzystając z widocznego tooltipa, a w przypadku błędu otrzymuje komunikat pod inputem.

3. **Dashboard:**
   - Po potwierdzeniu nicku użytkownik trafia do dashboardu, gdzie przegląda dynamicznie generowane rekomendacje.

4. **Ustawienia Konta:**
   - Z głównego menu lub side panelu użytkownik może przejść do ustawień konta, gdzie edytuje dane logowania, konfiguruje 2FA, personalizuje interfejs oraz ustawia parametry synchronizacji Spotify.

5. **Synchronizacja i Aktualizacje:**
   - System wykorzystuje React Query do obsługi operacji asynchronicznych, wyświetlając spinner podczas ładowania danych i synchronizacji.

## 4. Układ i struktura nawigacji

- **Desktop:**
  - Stały side panel prezentujący rekomendacje dostępny na wszystkich widokach.
  - Główne menu (umieszczone w górnej części lub jako panel boczny) umożliwiające szybkie przełączanie między dashboardem, ustawieniami konta oraz profilem użytkownika.

- **Mobile:**
  - Nawigacja oparta na menu hamburgerowym lub dolnej nawigacji, zoptymalizowana pod kątem interakcji dotykowych.
  - Priorytet dla kluczowych widoków, z intuicyjnym dostępem do głównego dashboardu i ustawień konta.

## 5. Kluczowe komponenty

- **Formularze rejestracji/loginu:** Integrujące metody tradycyjne i OAuth.
- **Widok wyboru nicku:** Z polem input, tooltipem oraz mechanizmem walidacji i komunikatami błędów.
- **Komponenty ustawień konta:** Formularze, inputy, przełączniki, sekcje dla danych logowania, 2FA, personalizacji i synchronizacji Spotify, wraz z spinnerem do operacji asynchronicznych.
- **Karty i listy rekomendacji:** Do prezentacji dynamicznych treści w dashboardzie.
- **Toast messages:** Do komunikacji statusów operacji oraz błędów.
- **React Query:** Do zarządzania stanem, cache'owania i synchronizacji danych z API.
- **Responsywny layout:** Wersja mobile first z dedykowanymi układami i gestami dotykowymi. 