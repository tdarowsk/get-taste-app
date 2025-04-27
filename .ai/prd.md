# Dokument wymagań produktu (PRD) - getTaste (MVP)

## 1. Przegląd produktu
Aplikacja getTaste ma na celu ułatwienie wyszukiwania muzyki i filmów dostosowanych do gustu użytkownika. Aplikacja umożliwia rejestrację, logowanie przez Supabase, edycję profilu z preferencjami muzycznymi i filmowymi, a także generowanie rekomendacji przy użyciu technologii OpenAI. System integruje się z API Spotify w celu pobierania aktualnych informacji o albumach i artystach, a dynamiczne rekomendacje są aktualizowane w odpowiedzi na zmiany w preferencjach użytkownika oraz opinie użytkownika na temat prezentowanych rekomendacji (system swipe right/swipe left). Projekt przewiduje automatyzację testów jednostkowych i end-to-end.

## 2. Problem użytkownika
Użytkownik ma problem ze znalezieniem muzyki lub filmu, który odpowiada jego indywidualnym preferencjom. Brak spersonalizowanych rekomendacji może skutkować marnowaniem czasu na wyszukiwanie treści w ogromnej liczbie dostępnych opcji. Aplikacja rozwiązuje ten problem poprzez dostarczenie dopasowanych rekomendacji opartych o preferencje użytkownika oraz jego wcześniejsze interakcje z rekomendacjami, co umożliwia szybsze i bardziej satysfakcjonujące odkrywanie nowych treści.

## 3. Wymagania funkcjonalne
1. Rejestracja i logowanie użytkownika z wykorzystaniem Supabase Authentication.
2. Strona informacyjna dla niezalogowanych użytkowników opisująca korzyści z korzystania z aplikacji.
3. Edytowalny profil użytkownika zawierający:
   - Preferencje muzyczne (gatunki, artyści).
   - Preferencje filmowe (gatunki, reżyser, obsada, scenarzysta).
4. System generowania rekomendacji z wykorzystaniem technologii OpenAI (wybór konkretnego modelu ustalony w przyszłości).
5. Dynamiczna aktualizacja rekomendacji na podstawie zmian w profilu użytkownika oraz interakcji z wcześniejszymi rekomendacjami.
6. Integracja z API Spotify do synchronizacji danych o albumach, artystach i doświadczeniu muzycznym.
7. Prosty i intuicyjny interfejs, zaprojektowany w podejściu mobile-first.
8. Zapisywanie ostatnich wyników rekomendacji w profilu użytkownika.
9. Automatyzacja testów jednostkowych oraz end-to-end, uruchamianych przy każdej zmianie kodu (GitHub Actions).
10. Interaktywny sidepanel z rekomendacjami i systemem swipe right/swipe left (lubię/nie lubię) do zbierania opinii użytkowników.
11. System uczenia się preferencji użytkownika na podstawie historii interakcji z rekomendacjami.

## 4. Granice produktu
1. ~~Brak możliwości oceniania rekomendacji (brak mechanizmu "lubię/nie lubię").~~
2. Brak systemu społecznościowego (np. dodawanie znajomych, udostępnianie gustu).
3. Brak zaawansowanego filtrowania wyników (np. według daty premiery, popularności).
4. Brak personalizacji UI/UX w oparciu o indywidualny styl użytkownika.
5. ~~Brak historii przeglądanych lub odrzuconych rekomendacji.~~
6. Brak funkcji czatu z AI lub dynamicznej rozmowy (np. "co chcesz dziś obejrzeć?").

## 5. Historyjki użytkowników

US-001  
Tytuł: Strona powitalna dla niezalogowanych użytkowników  
Opis: Jako niezalogowany użytkownik, chcę zobaczyć stronę informacyjną opisującą korzyści aplikacji getTaste, abym mógł zdecydować czy chcę się zarejestrować.  
Kryteria akceptacji:  
- Niezalogowani użytkownicy widzą stronę powitalną z opisem aplikacji zamiast dashboardu.
- Strona zawiera czytelny opis korzyści korzystania z aplikacji.
- Na stronie znajduje się wyraźny przycisk kierujący do strony logowania/rejestracji.
- Interfejs jest przyjazny i zachęcający do założenia konta.

US-002  
Tytuł: Rejestracja użytkownika przez Supabase  
Opis: Jako nowy użytkownik, chcę móc zarejestrować się w systemie korzystając z Supabase Authentication, aby mieć dostęp do spersonalizowanych rekomendacji.  
Kryteria akceptacji:  
- Użytkownik może zarejestrować konto podając wymagane dane (email, hasło).
- System weryfikuje poprawność wprowadzonych danych.
- Użytkownik otrzymuje potwierdzenie rejestracji.
- Po rejestracji użytkownik jest od razu zalogowany.

US-003  
Tytuł: Logowanie użytkownika przez Supabase  
Opis: Jako zarejestrowany użytkownik, chcę móc logować się do aplikacji za pomocą Supabase Authentication, aby mieć dostęp do moich spersonalizowanych rekomendacji.  
Kryteria akceptacji:  
- Użytkownik może zalogować się przy użyciu swoich danych (email, hasło).
- Po poprawnym zalogowaniu użytkownik jest przekierowany do dashboardu.
- System poprawnie obsługuje błędy logowania i wyświetla odpowiednie komunikaty.
- Użytkownik ma możliwość odzyskania hasła w przypadku jego zapomnienia.

US-004  
Tytuł: Edycja profilu użytkownika  
Opis: Jako użytkownik, chcę mieć możliwość edycji mojego profilu, aby ustawić i aktualizować moje preferencje muzyczne i filmowe.  
Kryteria akceptacji:  
- Użytkownik może modyfikować swoje preferencje muzyczne (gatunki, artyści).  
- Użytkownik może modyfikować swoje preferencje filmowe (gatunki, reżyser, obsada, scenarzysta).  
- Zmiany są zapisywane i od razu widoczne.

US-005  
Tytuł: Generowanie rekomendacji  
Opis: Jako użytkownik, chcę otrzymywać rekomendacje dotyczące muzyki i filmów na podstawie moich preferencji, aby szybko znaleźć treści odpowiadające mojemu gustowi.  
Kryteria akceptacji:  
- System generuje rekomendacje na podstawie profilu użytkownika oraz historii interakcji.
- Rekomendacje są generowane przy logowaniu oraz podczas aktualizacji profilu.  
- Użytkownik może zobaczyć listę propozycji dopasowanych do jego preferencji.

US-006  
Tytuł: Synchronizacja z Spotify  
Opis: Jako użytkownik, chcę, aby moja aplikacja była zintegrowana z Spotify, aby moje preferencje muzyczne były wzbogacone o najnowsze informacje o albumach i artystach.  
Kryteria akceptacji:  
- System pobiera dane z API Spotify w tle przy logowaniu.  
- Synchronizacja danych odbywa się automatycznie i jest niewidoczna dla użytkownika.  
- Informacje z Spotify są wykorzystywane do generowania rekomendacji.

US-007  
Tytuł: Dynamiczna aktualizacja rekomendacji  
Opis: Jako użytkownik, chcę, aby rekomendacje były aktualizowane dynamicznie w odpowiedzi na zmiany w moich preferencjach, aby zawsze otrzymywać najnowsze propozycje.  
Kryteria akceptacji:  
- System automatycznie aktualizuje rekomendacje po zmianie preferencji w profilu.
- System aktualizuje rekomendacje na podstawie interakcji użytkownika z poprzednimi propozycjami.
- Użytkownik otrzymuje nowe rekomendacje bez konieczności ponownego logowania.

US-008  
Tytuł: Interakcja z rekomendacjami poprzez system swipe  
Opis: Jako użytkownik, chcę móc łatwo oceniać proponowane mi rekomendacje poprzez system swipe right/swipe left, aby algorytm lepiej poznał mój gust.  
Kryteria akceptacji:  
- Użytkownik widzi rekomendacje w formie kart w sidepanelu aplikacji.
- Użytkownik może przeciągnąć kartę w prawo (lubię) lub w lewo (nie lubię).
- System zapisuje ocenę użytkownika i wykorzystuje ją do ulepszenia przyszłych rekomendacji.
- Po ocenieniu wszystkich rekomendacji, system generuje nowe propozycje.

US-009  
Tytuł: Historia ocenionych rekomendacji  
Opis: Jako użytkownik, chcę mieć dostęp do historii moich ocenionych rekomendacji, aby móc wrócić do pozytywnie ocenionych treści.  
Kryteria akceptacji:  
- System przechowuje historię wszystkich ocenionych rekomendacji.
- Użytkownik ma dostęp do listy swoich polubionych rekomendacji.
- Użytkownik może filtrować historię według typu (muzyka/film) oraz oceny (pozytywna/negatywna).

US-010  
Tytuł: Wylogowanie użytkownika  
Opis: Jako zalogowany użytkownik, chcę móc wylogować się z aplikacji, aby zakończyć sesję i zabezpieczyć swoje dane, szczególnie gdy korzystam z aplikacji na współdzielonym urządzeniu.  
Kryteria akceptacji:  
- Widoczny przycisk wylogowania jest dostępny z poziomu każdego ekranu aplikacji.
- Po kliknięciu przycisku wylogowania, użytkownik zostaje natychmiast wylogowany.
- Po wylogowaniu użytkownik jest przekierowany do strony powitalnej.
- Wszystkie dane sesji są usuwane po wylogowaniu.

US-011  
Tytuł: Usuwanie rekomendacji  
Opis: Jako użytkownik, chcę mieć możliwość usunięcia zapisanej rekomendacji ze swojego profilu, aby zarządzać listą zainteresowań.  
Kryteria akceptacji:  
- Na liście historii ocenionych rekomendacji obok każdej pozycji jest widoczny przycisk usuwania.
- Po kliknięciu przycisku usunięcia, wybrana rekomendacja zostaje usunięta z historii.
- Lista rekomendacji jest automatycznie odświeżana po usunięciu.

## 6. Metryki sukcesu
1. Co najmniej 90% użytkowników posiada w pełni uzupełnione profile z poprawnymi danymi dotyczącymi preferencji.
2. Co najmniej 75% użytkowników otrzymuje spersonalizowane rekomendacje.
3. Co najmniej 60% użytkowników aktywnie korzysta z systemu oceniania rekomendacji (swipe right/swipe left).
4. System działa stabilnie, a jakość rekomendacji jest monitorowana przez automatyczne testy jednostkowe i end-to-end uruchamiane przy każdej zmianie kodu.
5. Integracja z API Spotify działa nieprzerwanie w tle, zapewniając płynność operacji.
6. Co najmniej 50% niezalogowanych użytkowników, którzy odwiedzają stronę powitalną, decyduje się na utworzenie konta.