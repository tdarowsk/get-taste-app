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

US-012  
Tytuł: Unikalne rekomendacje  
Opis: Jako użytkownik, chcę otrzymywać wyłącznie unikalne rekomendacje, aby nie widzieć tych samych propozycji wielokrotnie oraz nie otrzymywać ponownie treści, które już polubiłem lub odrzuciłem.  
Kryteria akceptacji:

- System nie wyświetla tej samej rekomendacji więcej niż raz w danej rundzie.
- Rekomendacje, które użytkownik polubił (swipe right), nie są ponownie wyświetlane w nowych propozycjach.
- System przechowuje historię wyświetlonych rekomendacji, aby unikać ich powtarzania przez określony czas.
- Jeśli liczba dostępnych rekomendacji jest ograniczona, system informuje użytkownika o potrzebie rozszerzenia preferencji.
- System pozwala na opcjonalne "resetowanie" historii wyświetlonych rekomendacji po długim czasie nieaktywności lub na żądanie użytkownika.

US-013  
Tytuł: Adaptacyjny system rekomendacji oparty na swipe'ach  
Opis: Jako użytkownik, chcę, aby każda moja interakcja typu swipe right/swipe left natychmiast wpływała na algorytm rekomendacji, dostosowując kolejne propozycje do moich preferencji w czasie rzeczywistym.  
Kryteria akceptacji:

- Każda akcja swipe (w prawo/w lewo) jest natychmiast zapisywana w systemie jako dane uczące dla algorytmu.
- Algorytm AI wykorzystuje modele z OpenRouter.ai do analizy wzorców w decyzjach użytkownika.
- Następna seria rekomendacji uwzględnia najnowsze interakcje użytkownika, pokazując zauważalną zmianę ukierunkowania propozycji.
- System przechowuje metadane o cechach treści, które użytkownik polubił lub odrzucił (np. gatunki muzyczne, reżyserów filmów).
- Użytkownik otrzymuje wizualne potwierdzenie, że jego interakcja została uwzględniona (np. komunikat "Twój gust został zaktualizowany").
- System potrafi zidentyfikować i adaptować się do zmieniających się preferencji użytkownika w miarę upływu czasu.

US-014  
Tytuł: Zaawansowany algorytm rekomendacji oparty na metadanych  
Opis: Jako użytkownik, chcę aby system zbierał szczegółowe metadane z polubionych przeze mnie treści (gatunki muzyczne, gatunki filmowe, członkowie obsady, reżyserzy, scenarzyści) i wykorzystywał je do generowania coraz bardziej dopasowanych rekomendacji.  
Kryteria akceptacji:

- System zapisuje szczegółowe metadane z każdej polubionej pozycji, w tym gatunki muzyczne/filmowe, wykonawców, reżyserów, scenarzystów i członków obsady.
- Algorytm analizuje wzorce w metadanych polubionych treści, identyfikując preferencje użytkownika na poziomie szczegółowych atrybutów.
- Nowe rekomendacje są prezentowane z priorytetem dla pozycji zawierających metadane podobne do tych z polubionych treści.
- Algorytm wykorzystuje techniki uczenia maszynowego do wykrywania nieoczywistych związków między polubionymi treściami.
- System dynamicznie aktualizuje wagi poszczególnych cech metadanych w zależności od częstotliwości ich występowania w polubionych treściach.
- Użytkownik może zobaczyć uzasadnienie, dlaczego dana rekomendacja została mu przedstawiona (np. "polecane, ponieważ lubisz reżysera X").

US-015  
Tytuł: Inteligentne rekomendacje z wykorzystaniem OpenRouter.ai  
Opis: Jako użytkownik, chcę otrzymywać inteligentne rekomendacje generowane przez zaawansowane modele AI dostępne poprzez OpenRouter.ai na podstawie historii moich polubień, aby odkrywać nowe treści, które mogłyby mi się spodobać, ale które sam bym nie znalazł.  
Kryteria akceptacji:

- System wykorzystuje API OpenRouter.ai do generowania rekomendacji w oparciu o historię polubionych treści użytkownika.
- Modele AI analizują nie tylko metadane, ale również kontekst kulturowy i trendy, proponując treści wykraczające poza oczywiste wybory.
- Rekomendacje uwzględniają szerszy kontekst kulturowy i związki między różnymi dziełami (np. inspiracje, podobne motywy).
- System wybiera optymalny model AI z dostępnych przez OpenRouter.ai w zależności od typu rekomendacji i ilości dostępnych danych.
- Koszty zapytań API są monitorowane i optymalizowane, aby zapewnić efektywność ekonomiczną.
- Użytkownik otrzymuje zaskakujące, ale trafne rekomendacje, które poszerzają jego horyzonty muzyczne i filmowe.
- System podaje uzasadnienie rekomendacji w formie krótkiego opisu wyjaśniającego, dlaczego dana pozycja może się spodobać użytkownikowi.

US-016  
Tytuł: Czasowe zablokowanie wyboru muzyki w sliderach  
Opis: Jako właściciel produktu, chcę mieć możliwość czasowego zablokowania wyboru muzyki w sliderach (przełącznikach typu Music/Films/Film/Music), aby użytkownicy mogli korzystać wyłącznie z rekomendacji filmowych. Wartość ta ma być kontrolowana przez zmienną środowiskową `isMusicEnabled`. Jeśli `isMusicEnabled` jest ustawione na `false`, oba slidery mają być na sztywno ustawione na "film" i nie pozwalać na zmianę przez użytkownika.  
Kryteria akceptacji:
- Wartość przełączników (sliderów) Music/Films oraz Film/Music jest pobierana z enva `isMusicEnabled`.
- Jeśli `isMusicEnabled` jest `false`, oba slidery są zablokowane i ustawione na "film".
- Jeśli `isMusicEnabled` jest `true`, użytkownik może swobodnie przełączać między muzyką a filmami.
- Zmiana wartości enva nie wymaga restartu aplikacji przez użytkownika (może być wymagany restart serwera).
- Zablokowane slidery są wizualnie wyszarzone lub nieaktywne.

US-017  
Tytuł: Płynne animacje swipowania rekomendacji  
Opis: Jako użytkownik, chcę doświadczać płynnych i atrakcyjnych wizualnie animacji podczas swipowania kart z rekomendacjami, aby korzystanie z aplikacji było przyjemniejsze i bardziej intuicyjne.  
Kryteria akceptacji:
- Karty rekomendacji reagują w czasie rzeczywistym na gest przeciągnięcia (swipe).
- Podczas przeciągania karty w prawo/lewo, widoczna jest animacja obrotu i przesunięcia.
- Po zwolnieniu karty, animacja płynnie kończy ruch w odpowiednim kierunku.
- Karta następna pojawia się z płynną animacją wejścia.
- Animacje są zoptymalizowane wydajnościowo i działają płynnie nawet na słabszych urządzeniach.
- Dodane są wizualne wskaźniki (np. kolor zielony dla "lubię", czerwony dla "nie lubię") podczas przeciągania karty.
- Animacje są zgodne z ogólnym stylem wizualnym aplikacji.

## 6. Metryki sukcesu

1. Co najmniej 90% użytkowników posiada w pełni uzupełnione profile z poprawnymi danymi dotyczącymi preferencji.
2. Co najmniej 75% użytkowników otrzymuje spersonalizowane rekomendacje.
3. Co najmniej 60% użytkowników aktywnie korzysta z systemu oceniania rekomendacji (swipe right/swipe left).
4. System działa stabilnie, a jakość rekomendacji jest monitorowana przez automatyczne testy jednostkowe i end-to-end uruchamiane przy każdej zmianie kodu.
5. Integracja z API Spotify działa nieprzerwanie w tle, zapewniając płynność operacji.
6. Co najmniej 50% niezalogowanych użytkowników, którzy odwiedzają stronę powitalną, decyduje się na utworzenie konta.
