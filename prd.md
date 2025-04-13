# Dokument wymagań produktu (PRD) - getTaste (MVP)

## 1. Przegląd produktu
Aplikacja getTaste ma na celu ułatwienie wyszukiwania muzyki i filmów dostosowanych do gustu użytkownika. Aplikacja umożliwia rejestrację, logowanie, edycję profilu z preferencjami muzycznymi i filmowymi, a także generowanie rekomendacji przy użyciu technologii OpenAI. System integruje się z API Spotify w celu pobierania aktualnych informacji o albumach i artystach, a dynamiczne rekomendacje są aktualizowane w odpowiedzi na zmiany w preferencjach użytkownika. Projekt przewiduje wdrożenie zabezpieczenia 2FA oraz automatyzację testów jednostkowych i end-to-end.

## 2. Problem użytkownika
Użytkownik ma problem ze znalezieniem muzyki lub filmu, który odpowiada jego indywidualnym preferencjom. Brak spersonalizowanych rekomendacji może skutkować marnowaniem czasu na wyszukiwanie treści w ogromnej liczbie dostępnych opcji. Aplikacja rozwiązuje ten problem poprzez dostarczenie dopasowanych rekomendacji opartych o preferencje użytkownika, co umożliwia szybsze i bardziej satysfakcjonujące odkrywanie nowych treści.

## 3. Wymagania funkcjonalne
1. Rejestracja i logowanie użytkownika z wykorzystaniem 2FA opartego na aplikacji mobilnej.
2. Edytowalny profil użytkownika zawierający:
   - Preferencje muzyczne (gatunki, artyści).
   - Preferencje filmowe (gatunki, reżyser, obsada, scenarzysta).
3. System generowania rekomendacji z wykorzystaniem technologii OpenAI (wybór konkretnego modelu ustalony w przyszłości).
4. Dynamiczna aktualizacja rekomendacji na podstawie zmian w profilu użytkownika.
5. Integracja z API Spotify do synchronizacji danych o albumach, artystach i doświadczeniu muzycznym.
6. Prosty i intuicyjny interfejs, zaprojektowany w podejściu mobile-first.
7. Zapisywanie ostatnich wyników rekomendacji w profilu użytkownika.
8. Automatyzacja testów jednostkowych oraz end-to-end, uruchamianych przy każdej zmianie kodu (GitHub Actions).

## 4. Granice produktu
1. Brak możliwości oceniania rekomendacji (brak mechanizmu "lubię/nie lubię").
2. Brak systemu społecznościowego (np. dodawanie znajomych, udostępnianie gustu).
3. Brak zaawansowanego filtrowania wyników (np. według daty premiery, popularności).
4. Brak personalizacji UI/UX w oparciu o indywidualny styl użytkownika.
5. Brak historii przeglądanych lub odrzuconych rekomendacji.
6. Brak funkcji czatu z AI lub dynamicznej rozmowy (np. "co chcesz dziś obejrzeć?").

## 5. Historyjki użytkowników

US-001  
Tytuł: Rejestracja użytkownika z 2FA  
Opis: Jako nowy użytkownik, chcę móc zarejestrować się w systemie z wykorzystaniem zabezpieczenia 2FA, aby moje konto było bezpieczne.  
Kryteria akceptacji:  
- Użytkownik może zarejestrować konto podając wymagane dane.  
- System wysyła kod weryfikacyjny przez aplikację mobilną.  
- Użytkownik wprowadza kod, który jest weryfikowany przez system.  
- Rejestracja zakończona powodzeniem po poprawnej weryfikacji.

US-002  
Tytuł: Logowanie użytkownika z 2FA  
Opis: Jako zarejestrowany użytkownik, chcę móc logować się do aplikacji przy użyciu 2FA, aby zapewnić bezpieczeństwo mojego konta.  
Kryteria akceptacji:  
- Użytkownik loguje się przy użyciu swoich danych.  
- Po wprowadzeniu danych, system wymaga kodu 2FA.  
- Kod weryfikacyjny jest wysyłany przez aplikację mobilną.  
- Logowanie jest zakończone sukcesem po poprawnej weryfikacji kodu.

US-003  
Tytuł: Edycja profilu użytkownika  
Opis: Jako użytkownik, chcę mieć możliwość edycji mojego profilu, aby ustawić i aktualizować moje preferencje muzyczne i filmowe.  
Kryteria akceptacji:  
- Użytkownik może modyfikować swoje preferencje muzyczne (gatunki, artyści).  
- Użytkownik może modyfikować swoje preferencje filmowe (gatunki, reżyser, obsada, scenarzysta).  
- Zmiany są zapisywane i od razu widoczne.

US-004  
Tytuł: Generowanie rekomendacji  
Opis: Jako użytkownik, chcę otrzymywać rekomendacje dotyczące muzyki i filmów na podstawie moich preferencji, aby szybko znaleźć treści odpowiadające mojemu gustowi.  
Kryteria akceptacji:  
- System generuje rekomendacje na podstawie profilu użytkownika.  
- Rekomendacje są generowane przy logowaniu oraz podczas aktualizacji profilu.  
- Użytkownik może zobaczyć listę propozycji dopasowanych do jego preferencji.

US-005  
Tytuł: Synchronizacja z Spotify  
Opis: Jako użytkownik, chcę, aby moja aplikacja była zintegrowana z Spotify, aby moje preferencje muzyczne były wzbogacone o najnowsze informacje o albumach i artystach.  
Kryteria akceptacji:  
- System pobiera dane z API Spotify w tle przy logowaniu.  
- Synchronizacja danych odbywa się automatycznie i jest niewidoczna dla użytkownika.  
- Informacje z Spotify są wykorzystywane do generowania rekomendacji.

US-006  
Tytuł: Dynamiczna aktualizacja rekomendacji  
Opis: Jako użytkownik, chcę, aby rekomendacje były aktualizowane dynamicznie w odpowiedzi na zmiany w moich preferencjach, aby zawsze otrzymywać najnowsze propozycje.  
Kryteria akceptacji:  
- System automatycznie aktualizuje rekomendacje po zmianie preferencji w profilu.  
- Użytkownik otrzymuje nowe rekomendacje bez konieczności ponownego logowania.

## 6. Metryki sukcesu
1. Co najmniej 90% użytkowników posiada w pełni uzupełnione profile z poprawnymi danymi dotyczącymi preferencji.
2. Co najmniej 75% użytkowników otrzymuje spersonalizowane rekomendacje.
3. System działa stabilnie, a jakość rekomendacji jest monitorowana przez automatyczne testy jednostkowe i end-to-end uruchamiane przy każdej zmianie kodu.
4. Integracja z API Spotify oraz zabezpieczenie 2FA działają nieprzerwanie w tle, zapewniając płynność i bezpieczeństwo operacji.